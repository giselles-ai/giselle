export function GitHubRepositoryBlock({
  owner,
  repo,
  isPrivate = true,
}: {
  owner: string;
  repo: string;
  isPrivate?: boolean;
}) {
  return (
    <div className="flex items-center px-[14px] py-[10px] rounded-[4px]">
      <p className="flex items-center gap-x-2">
        <span className="flex items-center">
          <span>{owner}</span>
          <span>/</span>
          <span>{repo}</span>
        </span>
        <span className="rounded-full px-1.5 py-px text-black-300 font-medium text-[10px] leading-normal font-geist border-[0.5px] border-black-400">
          {isPrivate ? "Private" : "Public"}
        </span>
      </p>
    </div>
  );
}
