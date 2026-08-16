import { useState } from 'react';

const initialFormData = {
    title: '',
    priority: 'Medium',
    category: 'Work',
    description: ''

};

const NoteForm = ({ addNoteFunc }) => {
    const [formData, setFormData] = useState(initialFormData);

    const submitButton = () => {
        if (formData.title === '') return;

        addNoteFunc(formData);
        setFormData(initialFormData);
    }

    return (
        <form className='mb-6'>
            <div className='mb-4'>
                <label htmlFor='title' className='block font-semibold'>
                    Title
                </label>
                <input
                    type='text'
                    className='w-full p-2 border rounded-lg'
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className='mb-4'>
                <label htmlFor='priority' className='block font-semibold'>
                    Priority
                </label>
                <select
                    type='text'
                    className='w-full p-2 border rounded-lg'
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value='High'>High</option>
                    <option value='Medium'>Medium</option>
                    <option value='Low'>Low</option>
                </select>
            </div>

            <div className='mb-4'>
                <label htmlFor='category' className='block font-semibold'>
                    Category
                </label>
                <select
                    type='text'
                    className='w-full p-2 border rounded-lg'
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value='Work'>Work</option>
                    <option value='Personal'>Personal</option>
                    <option value='Ideas'>Ideas</option>
                </select>
            </div>

            <div className='mb-4'>
                <label htmlFor='description' className='block font-semibold'>
                    Description
                </label>
                <textarea
                    type='text'
                    className='w-full p-2 border rounded-lg'
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}>
                </textarea>
            </div>

            <button
                type="button"
                className='w-full bg-purple-500 text-white py-2 rounded-lg cursor-pointer hover: bg-purple-600'
                onClick={submitButton}
            >
                Add Note
            </button>
        </form>
    )
}

export default NoteForm;
