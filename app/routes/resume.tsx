import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Summary from '~/components/Summary';
import Details from '~/components/Details';
import ATS from '~/components/ATS';
import TailoredResumeCard from '~/components/TailoredResume';
import { usePuterStore } from '~/lib/puter';

export const meta = () => ([
    { title: "ResCheck | Review" },
    { name: "description", content: "detailed overview of your resume" },
]);

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageURL, setImageUrl] = useState('');
    const [resumeURL, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [resumeText, setResumeText] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [tailored, setTailored] = useState<TailoredResume | null>(null);
    const [isTailoring, setIsTailoring] = useState(false);
    const [tailorError, setTailorError] = useState('');
    const navigate = useNavigate(); // ✅ removed unnecessary NavigateFunction type

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/resume/${id}`);
        }
    }, [auth.isAuthenticated, isLoading]);

    useEffect(() => {
        const loadResume = async () => {
            if (!id) return;

            const resume = await kv.get(`resume:${id}`);
            if (!resume) {
                setTimeout(() => navigate('/upload'), 1000);
                return;
            }

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumepath);
            if (!resumeBlob) {
                setTimeout(() => navigate('/upload'), 1000);
                return;
            }

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            setResumeUrl(URL.createObjectURL(pdfBlob));

            const imageBlob = await fs.read(data.imagePath);
            if (!imageBlob) {
                setTimeout(() => navigate('/upload'), 1000);
                return;
            }

            setImageUrl(URL.createObjectURL(imageBlob));
            setFeedback(data.feedback);
            setResumeText(data.resumeText ?? '');
            setJobTitle(data.jobTitle ?? '');
            setJobDescription(data.jobDescription ?? '');
            setTailored(data.tailoredResume ?? null);
        };

        void loadResume();
    }, [id, kv, fs, navigate]);

    const handleTailor = async () => {
        if (!resumeText) {
            setTailorError('No resume text was saved for this analysis — try re-uploading.');
            return;
        }

        setIsTailoring(true);
        setTailorError('');

        try {
            const response = await fetch('/api/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jobTitle, jobDescription, feedback }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error ?? `Request failed with status ${response.status}`);
            }

            const result: TailoredResume = await response.json();
            setTailored(result);

            if (id) {
                const raw = await kv.get(`resume:${id}`);
                if (raw) {
                    const data = JSON.parse(raw);
                    data.tailoredResume = result;
                    await kv.set(`resume:${id}`, JSON.stringify(data));
                }
            }
        } catch (err) {
            setTailorError(err instanceof Error ? err.message : 'Failed to tailor resume.');
        } finally {
            setIsTailoring(false);
        }
    };

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/images/back.svg" alt="back" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section">
                    {imageURL && resumeURL ? (
                        <div className="animate-in fade-in duration-1000 gradient-border h-[90%] max-xl:h-fit">
                            <a href={resumeURL} target="_blank" rel="noopener noreferrer"> {/* ✅ fixed typo */}
                                <img
                                    src={imageURL}
                                    alt="Resume preview"
                                    className="w-full h-auto object-contain"
                                />
                            </a>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-600">Loading resume preview...</div>
                    )}
                </section>

                <section className="feedback-section">
                    <h2 className="text-4xl max-sm:text-2xl !text-black font-bold">Resume review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <Details feedback={feedback} />
                            <ATS score={feedback.ATS.score} suggestions={feedback.ATS.tips} />

                            {!tailored && (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleTailor}
                                        disabled={isTailoring}
                                        className="primary-button disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isTailoring ? 'Tailoring your resume...' : 'Tailor to this role'}
                                    </button>
                                    {tailorError && (
                                        <p className="text-sm text-red-500">{tailorError}</p>
                                    )}
                                </div>
                            )}

                            {tailored && <TailoredResumeCard tailored={tailored} />}
                        </div>
                    ) : (
                        <img src="/images/scan.svg" alt="loading" className="w-16 h-16" />
                    )}
                </section>
            </div>
        </main>
    );
};

export default Resume;