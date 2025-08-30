import { Circles } from 'react-loader-spinner';

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur border border-zinc-200/70 dark:border-zinc-800/70 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <Circles
            height={50}
            width={50}
            color="rgb(39 39 42)"
            secondaryColor="rgb(156 163 175)"
            ariaLabel="circles-loading"
            visible={true}
          />
          <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
