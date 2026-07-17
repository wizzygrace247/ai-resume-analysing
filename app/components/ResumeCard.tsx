import { Link } from "react-router";
import { useEffect, useState } from "react";
import ScoreCircle from "./scoreCircle";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({ resume }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        let objectUrl: string | null = null;

        const loadImage = async () => {
            // Sample/demo data points at a public asset path directly; only
            // real uploads (stored in Puter's file system) need fs.read().
            if (resume.imagePath.startsWith('/images/') || resume.imagePath.startsWith('http')) {
                setResumeUrl(resume.imagePath);
                return;
            }

            const blob = await fs.read(resume.imagePath);
            if (!blob) return;
            objectUrl = URL.createObjectURL(blob);
            setResumeUrl(objectUrl);
        };

        void loadImage();

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [resume.imagePath, fs]);

    return (
        <Link to={`/resume/${resume.id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2 min-w-0">
                    {resume.companyName && (
                        <h2 className="text-white font-bold break-words">{resume.companyName}</h2>
                    )}
                    {resume.jobTitle && (
                        <h3 className="text-lg break-words text-gray-300">{resume.jobTitle}</h3>
                    )}
                    {!resume.companyName && !resume.jobTitle && <h2 className="text-white font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={resume.feedback.overallScore} />
                </div>
            </div>
            <div className="w-full h-full">
                <img
                    src={resumeUrl || "https://placehold.co/400x560?text=Resume"}
                    alt="resume"
                    className="w-full h-[360px] max-sm:h-[220px] object-cover"
                    onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x560?text=Resume";
                    }}
                />
            </div>
        </Link>
    );
};

export default ResumeCard;