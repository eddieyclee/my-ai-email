import DailyBrief from "./daily-brief";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <DailyBrief />
    </div>
  );
}
