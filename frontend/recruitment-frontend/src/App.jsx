import { useEffect } from 'react';

function App() {
  useEffect(() => {
  fetch('http://127.0.0.1:8000/api/test')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
}, []);
  return <h1>Vite + React + Laravel Connected</h1>;
}

export default App;
