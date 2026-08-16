
import { useState } from 'react';
import './App.css'
import NoteItem from './NoteItem';

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');

  const addNote = () => {
    if (text.trim() === "") return;

    setNotes([...notes, text]);
    setText('');
  }

  const deleteNote = (index) => {
    console.log('delete note' + index);

    setNotes(notes.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h1>Notes App {1 + 10}</h1>
      <input type='text' value={text} onChange={((e) => setText(e.target.value))} placeholder='write note' />
      <button onClick={addNote} >Add Note</button>

      <ul className='notelist' style={{ backgroundColor: 'black' }}>
        {
          notes.map((note, index) => (
            <NoteItem key={index} index={index} note={note} deleteNote={deleteNote} />
          ))
        }
      </ul>

    </div>
  )
}

export default App
