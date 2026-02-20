function CreateExam() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Exam</h1>

      <div className="bg-white p-6 rounded shadow max-w-lg">
        <input
          type="text"
          placeholder="Exam Name"
          className="w-full p-2 mb-4 border rounded"
        />

        <input
          type="text"
          placeholder="Subject"
          className="w-full p-2 mb-4 border rounded"
        />

        <input
          type="date"
          className="w-full p-2 mb-4 border rounded"
        />

        <input
          type="number"
          placeholder="Total Papers"
          className="w-full p-2 mb-4 border rounded"
        />

        <button className="bg-green-600 text-white px-6 py-2 rounded">
          Create
        </button>
      </div>
    </div>
  );
}

export default CreateExam;
