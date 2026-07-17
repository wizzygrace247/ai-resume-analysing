import React, { useState } from 'react'
import Navbar from '~/components/Navbar'
import FileUploader from '~/components/Fileuploader'
import { usePuterStore } from '~/lib/puter'
import { useNavigate } from 'react-router'
import { convertPdfToImage } from '~/lib/pdf2img'
import { extractResumeText } from '~/lib/pdftext'
import { generateUUID } from '~/lib/utils'

const Upload = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }
  const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
    setIsProcessing(true);
    setStatusText('Uploading the file....');

    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText('Error: failed to upload file');

    setStatusText('Converting to image.....');
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file) {
      return setStatusText(`Error: failed to convert PDF to image. ${imageFile.error ?? ''}`);
    }

    setStatusText('Uploading the image......');
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText('Error: failed to upload image');

    setStatusText('preparing Data......');


    setStatusText('Reading resume text.....');
    const extracted = await extractResumeText(file);
    if (!extracted.text) {
      return setStatusText(`Error: ${extracted.error ?? 'could not read resume text'}`);
    }

    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumepath: uploadedFile.path,
      imagePath: uploadedImage.path,
      resumeText: extracted.text,
      companyName, jobTitle, jobDescription,
      feedback: '' as string | Feedback,
    }
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText('Analyzing....');

    let feedback: Feedback;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: extracted.text,
          jobTitle,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error ?? `Request failed with status ${response.status}`);
      }

      feedback = await response.json();
    } catch (err) {
      return setStatusText(`Error: failed to analyze resume. ${err instanceof Error ? err.message : ''}`);
    }

    data.feedback = feedback;
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText('analysis complete redirecting...');
    navigate(`/resume/${uuid}`);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  }

  return (
    <main className="bg-[url('/images/background.svg')] bg-cover bg-center bg-no-repeat bg-fixed min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Get solid Feedback for your resume</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/scan.svg" className="w-48 h-48 mx-auto" alt="processing" />
            </>
          ) : (
            <h2>Upload your resume and get instant feedback on how to improve it for your job applications</h2>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">

              <div>
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="e.g. Google"
                  id="company-name"
                />
              </div>

              <div>
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="e.g. Frontend Developer"
                  id="job-title"
                />
              </div>

              <div>
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Paste the job description here..."
                  id="job-description"
                />
              </div>

              <div>
                <label htmlFor="resume-uploader">Upload Resume</label>
                <FileUploader onfileselect={handleFileSelect} />
              </div>

              <button type="submit" className="auth-button mt-4">
                Analyse Resume
              </button>

            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default Upload