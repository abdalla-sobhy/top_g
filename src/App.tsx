import "./App.css";
// import VideoUploader from "./components/VideoUploader";
// import AttachmentUploader from "./components/AttachmentUploader";
import CourseEdit from './pages/CourseEdit'

function App() {

  return (
    <>
      <CourseEdit />
      {/* <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          <li>use shadcn for creating custom components</li>
          <li>understand how useRef and forwradRef work</li>
          <li>anything that will be updated should send otherwise undefined , if you want to delete send null</li>
        </ul>
        <AttachmentUploader />
        <VideoUploader />
      </div> */}
    </>
  );
}

export default App;
