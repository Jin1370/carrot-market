export default function Home() {
    return (
        <main className="bg-gray-100 sm:bg-red-100 md:bg-green-100 lg:bg-cyan-100 xl:bg-orange-100 2xl:bg-purple-100 h-screen flex items-center justify-center p-5">
            <div className="bg-white shadow-lg p-5 rounded-3xl w-full max-w-screen-sm flex flex-col gap-3">
                {["Nico", "Me", "You", "Yourself", ""].map((person, index) => (
                    <div key={index} className="flex items-center gap-5 group">
                        <div className="size-10 bg-blue-400 rounded-sexy-name" />
                        <span className="text-lg font-medium empty:w-24 empty:h-5 empty:rounded-full empty:animate-pulse empty:bg-gray-300 group-hover:text-red-500">
                            {person}
                        </span>
                        <div className="size-6 bg-[#1315b4] text-white flex items-center justify-center rounded-full relative">
                            <span className="z-10">{index}</span>
                            <div className="size-6 bg-[#1315b4] rounded-full  absolute animate-ping" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
