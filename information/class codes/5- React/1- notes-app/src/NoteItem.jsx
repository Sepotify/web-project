export default function NoteItem({ index, note, deleteNote }) {

    return <>
        <li key={index}>{note}</li>
        <button onClick={() => deleteNote(index)} >Delete Note</button>
    </>;
}