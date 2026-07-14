import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logos Section */}
        <div className="flex justify-center items-center gap-8">
          <a href="https://vite.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-110 duration-300">
            <img src={viteLogo} className="h-16 w-16 drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer" className="transition-transform hover:scale-110 duration-300">
            <img src={reactLogo} className="h-16 w-16 animate-[spin_20s_linear_infinite] drop-shadow-[0_0_2em_#61dafbaa]" alt="React logo" />
          </a>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center space-y-4">
          {heroImg && (
            <img src={heroImg} className="h-40 w-auto object-contain mb-2 drop-shadow-md rounded-lg" alt="Hero illustration" />
          )}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Ativance + Tailwind CSS
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            Vite + React starter template configured with Tailwind CSS utility classes. Edit <code className="bg-slate-800 text-pink-400 px-2 py-0.5 rounded font-mono text-sm">src/App.jsx</code> to begin.
          </p>
        </div>

        {/* Counter Button */}
        <div>
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Count is {count}
          </button>
        </div>

        {/* Links / Docs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto pt-6 border-t border-slate-800">
          <a
            href="https://vite.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-indigo-550 rounded-xl text-left transition-all duration-300 group"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20">
              <img src={viteLogo} className="h-5 w-5" alt="Vite" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Explore Vite</h3>
              <p className="text-xs text-slate-400">Documentation & config details</p>
            </div>
          </a>

          <a
            href="https://react.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-purple-550 rounded-xl text-left transition-all duration-300 group"
          >
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20">
              <img src={reactLogo} className="h-5 w-5" alt="React" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Learn React</h3>
              <p className="text-xs text-slate-400">Component basics & hooks</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
