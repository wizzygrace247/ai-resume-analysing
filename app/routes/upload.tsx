import React, { useState } from 'react'
import Navbar from '~/components/Navbar'
import FileUploader from '~/components/Fileuploader'
import { usePuterStore } from '~/lib/puter'
import { useNavigate } from 'react-router'
import { convertPdfToImage } from '~/lib/pdf2img'
import { generateUUID } from '~/lib/utils'
import { prepareInstructions } from '~/constants'

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
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


    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumepath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName, jobTitle, jobDescription,
      feedback: '',
    }
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText('Analyzing....');


    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription })
    )

    if (!feedback) return setStatusText('Error: to analyze resume');

    const feedbackText = typeof feedback.message.content === 'string'
      ? feedback.message.content
      : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText('analysis complete redirecting...');
    console.log(data);
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
    <main className="bg-[url('/C:\\Users\\USER\\Desktop\\testing\\public\\images\\background.svg')] bg-cover bg-center bg-no-repeat bg-fixed min-h-screen">
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