import NoteForm from './components/NoteForm.jsx'
import NoteList from './components/NoteList.jsx'
import { useEffect, useState } from 'react'


const App = () => {
  const [showForm, setShowForm] = useState(true);

  const [notes, setNotes] = useState(() => {
    const notes = JSON.parse(localStorage.getItem('notes'));
    return notes || [];
  });

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);


  const addNoteFunc = (newNote) => {
    setNotes([...notes, newNote]);
  }

  const deleteNoteFunc = (index) => {
    setNotes(notes.filter((_, i) => i != index));
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Notes App</h2>

      {showForm && <NoteForm addNoteFunc={addNoteFunc} />}
      <NoteList notes={notes} deleteNoteFunc={deleteNoteFunc} />

      <button onClick={() => setShowForm(!showForm)}>toggle show form</button>

    </div>
  )
}

export default App
