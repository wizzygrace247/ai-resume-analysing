import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Summary from '~/components/Summary';
import Details from '~/components/Details';
import ATS from '~/components/ATS';
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
        };

        void loadResume();
    }, [id, kv, fs, navigate]);

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
                    <h2 className="text-4xl !text-black font-bold">Resume review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <Details feedback={feedback} />
                            <ATS score={feedback.ATS.score} suggestions={feedback.ATS.tips} />
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
