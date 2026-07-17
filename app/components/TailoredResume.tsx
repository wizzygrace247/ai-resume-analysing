import { useState } from "react";

const buildPlainText = (tailored: TailoredResume) => {
  const experience = tailored.experience
    .map(
      (job) =>
        `${job.role} — ${job.company}\n${job.bullets
          .map((b) => `- ${b}`)
          .join("\n")}`
    )
    .join("\n\n");

  return `SUMMARY\n${tailored.summary}\n\nEXPERIENCE\n${experience}\n\nSKILLS\n${tailored.skills.join(
    ", "
  )}`;
};

const TailoredResume = ({ tailored }: { tailored: TailoredResume }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPlainText(tailored));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([buildPlainText(tailored)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md w-full p-6 flex flex-col gap-6">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Tailored for this role</h2>
        <div className="flex flex-row gap-2">
          <button
            onClick={handleCopy}
            className="text-sm font-medium rounded-full border border-gray-200 px-4 py-2 cursor-pointer hover:bg-gray-50"
          >
            {copied ? "Copied!" : "Copy text"}
          </button>
          <button
            onClick={handleDownload}
            className="text-sm font-medium rounded-full border border-gray-200 px-4 py-2 cursor-pointer hover:bg-gray-50"
          >
            Download .txt
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Summary</h3>
        <p className="text-gray-600">{tailored.summary}</p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Experience</h3>
        {tailored.experience.map((job, i) => (
          <div key={i} className="flex flex-col gap-1">
            <p className="font-medium">
              {job.role} <span className="text-gray-500">— {job.company}</span>
            </p>
            <ul className="list-disc list-inside text-gray-600">
              {job.bullets.map((bullet, j) => (
                <li key={j}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Skills</h3>
        <div className="flex flex-row flex-wrap gap-2">
          {tailored.skills.map((skill, i) => (
            <span
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-4">
        <h3 className="text-lg font-semibold">What changed and why</h3>
        <ul className="list-disc list-inside text-gray-600">
          {tailored.changesExplained.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TailoredResume;