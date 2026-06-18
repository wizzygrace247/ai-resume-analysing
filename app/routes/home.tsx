import { useEffect } from "react";
import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { resumes } from "~/constants";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "rescheck" },
    { name: "description", content: "ai smart feedback for your job applications" },
  ];
}

export default function Home() {
  const { auth, isLoading } = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, isLoading]);

  return (
    <main className="bg-[url('/images/background.svg')] bg-cover bg-center bg-no-repeat bg-fixed min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading">
          <h1>check your applications and resume ratings</h1>
          <h2>Get instant review on your job applications and get yourself AI feedback</h2>
        </div>
      </section>

      {resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.resumePath} resume={resume} />
          ))}
        </div>
      )}
    </main>
  );
}