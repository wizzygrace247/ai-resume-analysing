import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "ResCheck | Home" },
    { name: "description", content: "ai smart feedback for your job applications" },
  ];
}

export default function Home() {
  const { auth, isLoading, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, isLoading]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const items = await kv.list('resume:*', true);

      const parsed = ((items ?? []) as KVItem[])
        .map((item) => {
          try {
            return JSON.parse(item.value);
          } catch {
            return null;
          }
        })
        .filter((data) => data && data.feedback)
        .map((data): Resume => ({
          id: data.id,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          imagePath: data.imagePath,
          resumePath: data.resumepath ?? data.resumePath,
          feedback: data.feedback,
        }))
        .reverse() // most recently uploaded first
        .slice(0, 6);

      setResumes(parsed);
      setLoadingResumes(false);
    };

    if (auth.isAuthenticated) {
      void loadResumes();
    }
  }, [auth.isAuthenticated, kv]);

  return (
    <main className="bg-[url('/images/background.svg')] bg-cover bg-center bg-no-repeat bg-fixed min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2>No resumes analyzed yet. Upload your first resume to get AI feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center gap-4">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" alt="Loading your resumes" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes.length === 0 && (
          <Link to="/upload" className="primary-button w-fit px-8 max-sm:w-full max-sm:text-center">
            Upload your first resume
          </Link>
        )}
      </section>
    </main>
  );
}