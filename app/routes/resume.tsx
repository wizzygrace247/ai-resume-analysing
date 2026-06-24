import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, type NavigateFunction } from 'react-router';
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
    const navigate: NavigateFunction = useNavigate();

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/resume/${id}`);
        }
    }, [auth.isAuthenticated, isLoading]);


    useEffect(() => {
        const loadResume = async () => {
            if (!id) {
                navigate('/upload');
                return;
            }

            const resume = await kv.get(`resume:${id}`);
            if (!resume) {
                navigate('/upload');
                return;
            }

            const data = JSON.parse(resume);
            const resumeBlob = await fs.read(data.resumepath);
            if (!resumeBlob) {
                navigate('/upload');
                return;
            }

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if (!imageBlob) {
                navigate('/upload');
                return;
            }

            setImageUrl(URL.createObjectURL(imageBlob));
            setFeedback(data.feedback);
            console.log({ imageURL, resumeURL, feedback: data.feedback });
        };

        void loadResume();
    }, [id, kv, fs, navigate]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/images/back.svg" alt="back" className="w-2.5 h-2.5" />
                    <span className=" text-grey-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section ">

                    {imageURL && resumeURL ? (
                        <div className="animate-in fade-in duration-1000 gradient-border smax-sm:m-0 h-[90%] max-wxl:h-fit">
                            <a href={resumeURL} target="_blank" rel="noonpener noreferrer"></a>
                            <img
                                src={imageURL}
                                alt="Resume preview"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-sm text-grey-600">Loading resume preview...</div>
                    )} </section>
                <section className="feedback-section">
                    <h2 className='text-4xl !text-black font-bold'>Resume review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000 ">
                            <summary feedback ={feedback} />
                            <ATS score = {feedback.ATS.score || 0}  {feedback.ATS.tips || {}}/>
                            <Details feedback ={feedback}/>
                        </div>
                    ) : (
                        <img src="/images/image-1.gif" alt="loading" className="w-6 h-6 animate-spin" />
                    )}
                </section>

            </div>
        </main>
    )

}

export default Resume;