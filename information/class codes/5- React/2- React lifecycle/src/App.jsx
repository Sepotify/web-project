import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import LifecycleLogger from './LifecycleLogger.jsx'
// import LifecycleLogger from './LifecycleLoggerClass.jsx'


function App() {
  const [showLogger, setShowLogger] = useState(false)

  return (
    <div>
      <h2>React Lifecycle Playground</h2>
      <button onClick={() => setShowLogger(!showLogger)}>
        {showLogger ? 'Unmount Logger' : 'Mount Logger'}
      </button>

      {showLogger && <LifecycleLogger />}
    </div>
  )
}

export default App
