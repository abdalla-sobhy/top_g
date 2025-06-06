// React core
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "react-responsive";

// Third‑party UI
import Select, { SingleValue } from "react-select";

// Your reusable UI components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Feature‑specific components
import VideoUploader from "../components/VideoUploader";
import AttachmentUploader, { AttachmentUploaderRef } from "../components/AttachmentUploader";
import RichTextEditor from "../components/RichTextEditor";
import SideBar from "@/components/SideBar";

// Styles
import CourseEditCSS from "../../public/styles/courseEdit.module.css";

// --- Types ---
interface options {
  value: string;
  label: string;
}


interface CourseDetails {
  title: string;
  maxStudents: number | null;
  targetAudience: string;
  prerequisites: string;
  originalPrice: number | null;
  discountedPrice: number | null;
  isPaid: boolean;
  totalTime: number | null;
}

// --- Constants ---
const Levels: options[] = [
  { value: "كل المستويات", label: "كل المستويات" },
  { value: "المستوي الاول", label: "المستوي الاول" },
  { value: "المستوي الثاني", label: "المستوي الثاني" },
  { value: "المستوي الثالث", label: "المستوي الثالث" },
];

const IntroVideos: options[] = [
  { value: "لا يوجد", label: "لا يوجد" },
  { value: "MP4", label: "MP4" },
  { value: "MKV", label: "MKV" },
  { value: "يوتيوب", label: "يوتيوب" },
  { value: "مضمن", label: "مضمن" },
  { value: "رابط خارجي", label: "رابط خارجي" },
];

const videoTypeMap: { [key: string]: string[] } = {
  MP4: ["video/mp4"],
  MKV: ["video/x-matroska"],
  يوتيوب: [],
  مضمن: [],
  "رابط خارجي": [],
};


const CourseTypeLabels = {
  free: "مجانية",
  paid: "مدفوعة",
};

export default function CourseEdit() {
  // --- Course categories ---
  const [courseCategories, setCourseCategories] = useState<options[]>([{
    value: "uncategorized",
    label: "بدون تصنيف",
  }]);
  const [areCategoriesLoading, setAreCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCourseTitleOption, setSelectedCourseTitleOption] = useState<options | null>(null);

  // --- Teachers ---
  const [teachers, setTeachers] = useState<options[]>([]);
  const [areTeachersLoading, setAreTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<options | null>(null);

  // --- Dialog ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addCategory, setAddCategory] = useState("أسم التصنيف");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // --- UI & editor ---
  const [editorContent, setEditorContent] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const isAtLeastMd = useMediaQuery({ minWidth: 768 });

  // --- Course Info ---
  const [selectedStartingVideos, setSelectedStartingVideos] = useState<options | null>(IntroVideos[0]);
  const [selectedLevel, setSelectedLevel] = useState<options | null>(Levels[0]);
  const [isFeatured, setIsFeatured] = useState(false);

  // --- Course Details State ---
  const [courseDetails, setCourseDetails] = useState<CourseDetails>({
    title: "",
    maxStudents: null,
    targetAudience: "",
    prerequisites: "",
    originalPrice: null,
    discountedPrice: null,
    isPaid: false,
    totalTime: null,
  });

  // --- Image ---
  const attachmentRef = useRef<AttachmentUploaderRef>(null);

  // --- Video ---
  const [externalLink, setExternalLink] = useState("");
  console.log(externalLink);

  // --- Helpers ---
  const createHandleChange = (setter: React.Dispatch<React.SetStateAction<options | null>>) => {
    return (opt: SingleValue<options>) => setter(opt);
  };

  // ---Submitting ---
  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- General Input Change Handler ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedValue = ["maxStudents", "originalPrice", "discountedPrice", "totalTime"].includes(name)
      ? parseInt(value.replace(/\D/g, ""))
      : value;

    setCourseDetails(prev => ({
      ...prev,
      [name]: updatedValue
    }));
  };

  const handleAddCategory = async (categoryName: string) => {
    setDialogError(null);
    setIsAddingCategory(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/course-categories", {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": "REPLACE_X_CSRF_TOKEN",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: categoryName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل إضافة التصنيف");
      }

      const data = await response.json();
      const newCategory = { value: data.id.toString(), label: data.name };

      setCourseCategories((prev) => [
        ...prev.filter((cat) => cat.value !== "uncategorized"),
        newCategory,
        { value: "uncategorized", label: "بدون تصنيف" },
      ]);

      setSelectedCourseTitleOption(newCategory);
      setAddCategory("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error adding category:", err);
      setDialogError("فشل إضافة التصنيف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAddingCategory(false);
    }
  };


  // --- Fetch Teachers ---
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/users", {
          headers: {
            "X-CSRF-TOKEN": "REPLACE_X_CSRF_TOKEN",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = data.data.map((t: any) => ({
          value: t.id,
          label: t.firstname + " " + t.lastname,
        }));

        setTeachers(transformed);
        if (!selectedTeacher && transformed.length > 0) setSelectedTeacher(transformed[transformed.length]);
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTeachersError("فشل تحميل المدرسين. يرجى المحاولة لاحقًا.");
      } finally {
        setAreTeachersLoading(false);
      }
    };

    fetchTeachers();
  }, []);




  // --- Fetch Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/course-categories", {
          headers: {
            "X-CSRF-TOKEN": "REPLACE_X_CSRF_TOKEN",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = data.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        }));

        setCourseCategories([...transformed, { value: "uncategorized", label: "بدون تصنيف" }]);
        if (!selectedCourseTitleOption && transformed.length > 0) setSelectedCourseTitleOption(transformed[transformed.length]);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategoriesError("فشل تحميل التصنيفات. يرجى المحاولة لاحقًا.");
      } finally {
        setAreCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);



  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const uploadedFiles = attachmentRef.current?.getUploadedFiles();
      const featuredImageId = uploadedFiles && uploadedFiles[0]?.id;

      const courseData = {
        title: courseDetails.title,
        description: editorContent,
        is_paid: courseDetails.isPaid, // Adjust based on if the course is paid
        price: courseDetails.originalPrice?? 0,
        discounted_price: courseDetails.discountedPrice?? 0,
        total_number_of_students: courseDetails.maxStudents?? 1,
        what_would_be_learned: "Learn how to program in PHP",
        target_audience: courseDetails.targetAudience,
        total_time: courseDetails.totalTime?? 0,
        prerequisites: courseDetails.prerequisites,
        video_type: 1, // ############# here 
        video_source: "https://www.youtube.com/watch?v=iAFce6VPgD4", // ############ here
        featured_image: featuredImageId ,//|| null,
        course_category_id: selectedCourseTitleOption?.value, // Replace with actual selected category id
        tutor_id: selectedTeacher?.value, // Replace with actual selected tutor id
        open_for_all: isFeatured,
      };

      const response = await fetch("http://127.0.0.1:8000/api/courses", {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": "REPLACE_X_CSRF_TOKEN",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error submitting the course");
      }

      const data = await response.json();
      console.log("Course submitted successfully:", data);
      // Handle success
    } catch (err) {
      console.error("Error submitting course:", err);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Sidebar scroll lock ---
  useEffect(() => {
    if (!isAtLeastMd && showSidebar) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isAtLeastMd, showSidebar]);

  return (
    <div className="courseEdit flex flex-row justify-between">
      <div className={CourseEditCSS.leftSide}>
        {!isAtLeastMd && (
          <div className="sideBarButtonContainer w-full flex justify-end pb-2">
            <div
              className="sideBarButton cursor-pointer w-12 h-12 bg-white flex justify-center items-center rounded-md"
              onClick={() => setShowSidebar(true)}
            >
              <img
                src="/assets/imgs/window_content_svgrepo_com.svg"
                className="w-8 h-8"
                alt="فتح القائمة الجانبية"
              />
            </div>
          </div>
        )}
        <div className={CourseEditCSS.modifyCourseContainer}>
          <div className={`${CourseEditCSS.modifyCourse}`}>
            <div className={CourseEditCSS.modifyCourseLabel}>تعديل الدورة</div>
            <div className={`${CourseEditCSS.modifyCourseImgDiv}`}>
              <img
                src="/assets/imgs/ChatGPT Image May 9, 2025, 03_32_39 PM.png"
                alt=""
              />
            </div>
          </div>
        </div>
        <div className={CourseEditCSS.CourseDataContainer}>
          <div className={CourseEditCSS.CourseData}>
            <div className={CourseEditCSS.CourseDataLabel}>بيانات الدورة</div>
            <hr />
            <div
              className={`${CourseEditCSS.courseTitleSection} flex md:flex-row flex-col-reverse justify-end mt-4 gap-2 pb-4`}
            >
              <div
                className={`${CourseEditCSS.courseClassification} flex flex-col`}
              >
                <div className={CourseEditCSS.label}>تصنيف الدورة</div>
                {areCategoriesLoading ? (
  <div className={CourseEditCSS.label}>جارٍ تحميل التصنيفات...</div>
) : categoriesError ? (
  <div className={CourseEditCSS.redLabel}>{categoriesError}</div>
) : (
                <div
                  className={`${CourseEditCSS.courseClassificationDropdownContainer} md:w-fit w-full flex justify-end`}
                >
                  <div className=" w-32">
                    <Select
                      classNamePrefix="react-select"
                      value={selectedCourseTitleOption}
                      onChange={createHandleChange(
                        setSelectedCourseTitleOption
                      )}
                      options={courseCategories}
                      isSearchable
                      styles={{
                        control: (base, { isFocused }) => ({
                          ...base,
                          backgroundColor: "#E5E7EB",
                          borderColor: isFocused ? "#ccc" : "#E5E7EB",
                          boxShadow: "none",
                          minHeight: "32px",
                          "&:hover": {
                            backgroundColor: "#D1D5DB",
                            borderColor: "#ccc",
                          },
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isFocused
                            ? "#E5E7EB"
                            : isSelected
                            ? "white"
                            : undefined,
                          color: "#333",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: "6px 12px",
                          ":active": { backgroundColor: "#E5E7EB" },
                        }),
                      }}
                    />
                  </div>
                </div>
)}
                <div className={CourseEditCSS.AddClassification}>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        variant="outline"
                      >
                        إضافة تصنيف{" "}
                        <img
                          src="/assets/imgs/plus_svgrepo_com.svg"
                          alt="Plus Icon"
                          className={`${CourseEditCSS.plusIcon} w-2`}
                        />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmed = addCategory.trim();
                          if (!trimmed) return;
                          const newCat = { value: trimmed, label: trimmed };
                          setCourseCategories((cats) => [...cats, newCat]);
                          setSelectedCourseTitleOption(newCat);
                          setAddCategory("");
                          setIsDialogOpen(false);
                          await handleAddCategory(trimmed);
                        }}
                      >
                        <DialogHeader className="flex justify-center w-full">
                          <DialogTitle className="flex justify-center w-full">
                            إضافة تصنيف
                          </DialogTitle>
                          <DialogDescription className="flex justify-center w-full">
                            أضف تصنيف للدورة.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Input
                              id="name"
                              value={addCategory}
                              onChange={(e) => setAddCategory(e.target.value)}
                              className="col-span-3"
                              dir="rtl"
                            />
                            <Label htmlFor="name" className="text-right">
                              التصنيف
                            </Label>
                          </div>
                          {dialogError && (
                            <div className="text-red-500 text-sm text-center">
                              {dialogError}
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex justify-center! w-full">
                          <Button type="submit" disabled={isAddingCategory} className="flex justify-center">
                            {isAddingCategory ? "جاري الإضافة..." : "أضف التصنيف"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div
                className={`${CourseEditCSS.courseTitleContainer} gap-2 flex flex-col w-full md:w-1/2`}
              >
                <div className={`${CourseEditCSS.label}`}>عنوان الدورة</div>
                <div className={`${CourseEditCSS.courseTitleTextBarContainer}`}>
                  <input dir="rtl" type="text" name="title" value={courseDetails.title} onChange={handleInputChange}/>
                </div>
              </div>
            </div>

            <div className={`${CourseEditCSS.courseDiscreptionContainer}`}>
              <div className={`${CourseEditCSS.label}`}>وصف الدورة</div>
              <div className={`${CourseEditCSS.CKEditorContainer} text-black`}>
                <RichTextEditor
                  value={editorContent}
                  onChange={(data) => setEditorContent(data)}
                />
              </div>
            </div>

            <div
              className={`${CourseEditCSS.teacherContainer} flex flex-col gap-1.5 mt-14`}
            >
              <div className={`${CourseEditCSS.label}`}>المعلم</div>
              {areTeachersLoading ? (
  <div className={CourseEditCSS.label}>جارٍ تحميل التصنيفات...</div>
) : teachersError ? (
  <div className={CourseEditCSS.redLabel}>{teachersError}</div>
) : (
              <div>
                <Select
                  classNamePrefix="react-select"
                  value={selectedTeacher}
                  onChange={createHandleChange(setSelectedTeacher)}
                  options={teachers}
                  isSearchable
                  styles={{
                    control: (base, { isFocused }) => ({
                      ...base,
                      backgroundColor: "#E5E7EB",
                      borderColor: isFocused ? "#ccc" : "#E5E7EB",
                      boxShadow: "none",
                      minHeight: "32px",
                      "&:hover": {
                        backgroundColor: "#D1D5DB",
                        borderColor: "#ccc",
                      },
                    }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isFocused
                        ? "#E5E7EB"
                        : isSelected
                        ? "white"
                        : undefined,
                      color: "#333",
                      cursor: "pointer",
                      fontSize: "12px",
                      padding: "6px 12px",
                      ":active": { backgroundColor: "#E5E7EB" },
                    }),
                  }}
                />
              </div>
              )}
            </div>

            <div
              className={`${CourseEditCSS.prominentImageContainer} flex flex-col gap-1.5 mt-8`}
            >
              <div className={`${CourseEditCSS.label}`}>صورة بارزة</div>
              <AttachmentUploader ref={attachmentRef} maxFiles={1} onUploadComplete={() => console.log('File uploaded')} />
            </div>

            <div className="introVideosAndOtherInputsContainer mt-16 pb-8">
              <div className="introVideosAndOtherInputs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {/* Cell 1: Intro video selector + uploader */}
                {isAtLeastMd && (
                  <div className="flex justify-center items-center">
    {selectedStartingVideos?.value !== "لا يوجد" && (
      <>
        {selectedStartingVideos?.value === "رابط خارجي" ? (
          <div className="flex justify-center flex-col w-full gap-3.5">
            <label className={`${CourseEditCSS.label}`}>أدخل الرابط الخارجي</label>
            <div className={`${CourseEditCSS.courseDurationTextBarContainer} w-full`}>
            <input
            className="w-full"
              type="url"
              placeholder="https://example.com"
              onChange={(e) => setExternalLink(e.target.value)}
            />
            </div>
          </div>
        ) : (
          <VideoUploader
            acceptedTypes={
              videoTypeMap[selectedStartingVideos?.value || "MP4"]
            }
            maxFiles={1}
            maxSize={2000}
          />
        )}
      </>
    )}
  </div>
)}
                <div className="col-span-1 flex flex-col gap-4">
                  <label className="text-gray-600 text-sm text-right">
                    فيديو المقدمة
                  </label>
                  <Select
                    classNamePrefix="react-select"
                    value={selectedStartingVideos}
                    onChange={createHandleChange(setSelectedStartingVideos)}
                    options={IntroVideos}
                    isSearchable
                    styles={{
                      control: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: "white",
                        borderColor: isFocused ? "#ccc" : "#E5E7EB",
                        boxShadow: "none",
                        minHeight: "32px",
                        "&:hover": {
                          backgroundColor: "#D1D5DB",
                          borderColor: "#ccc",
                        },
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isFocused
                          ? "#E5E7EB"
                          : isSelected
                          ? "white"
                          : undefined,
                        color: "#333",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "6px 12px",
                        ":active": { backgroundColor: "#E5E7EB" },
                      }),
                    }}
                  />
                </div>
                {!isAtLeastMd && (
  <div className="flex justify-center items-center">
    {selectedStartingVideos?.value !== "لا يوجد" && (
      <>
        {selectedStartingVideos?.value === "رابط خارجي" ? (
          <div className="flex justify-center flex-col w-full gap-3.5">
            <label className={`${CourseEditCSS.label}`}>أدخل الرابط الخارجي</label>
            <div className={`${CourseEditCSS.courseDurationTextBarContainer} w-full`}>
            <input
            className="w-full"
              type="url"
              placeholder="https://example.com"
              onChange={(e) => setExternalLink(e.target.value)}
            />
            </div>
          </div>
        ) : (
          <VideoUploader
            acceptedTypes={
              videoTypeMap[selectedStartingVideos?.value || "MP4"]
            }
            maxFiles={1}
            maxSize={2000}
          />
        )}
      </>
    )}
  </div>
)}

                {/* Cell 2: Duration */}
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className={`${CourseEditCSS.label}`}>
                    مدة الدورة (دقيقة)
                  </label>
                  <div className={CourseEditCSS.courseDurationTextBarContainer}>
                    <input
                      dir="rtl"
                      type="number"
                      className="courseDurationTextBarContainer"
                      name="totalTime"
                      value={courseDetails.totalTime??''}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Cell 3: Audience */}
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className={`${CourseEditCSS.label}`}>
                    الجمهور المستهدف
                  </label>
                  <div className={CourseEditCSS.courseDurationTextBarContainer}>
                    <input
                      dir="rtl"
                      type="text"
                      className="courseDurationTextBarContainer"
                      name="targetAudience"
                      value={courseDetails.targetAudience}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Cell 4: Level */}
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className={`${CourseEditCSS.label}`}>المستوي</label>
                  <Select
                    classNamePrefix="react-select"
                    value={selectedLevel}
                    onChange={createHandleChange(setSelectedLevel)}
                    options={Levels}
                    isSearchable
                    styles={{
                      control: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: "white",
                        borderColor: isFocused ? "#ccc" : "#E5E7EB",
                        boxShadow: "none",
                        minHeight: "32px",
                        "&:hover": {
                          backgroundColor: "#D1D5DB",
                          borderColor: "#ccc",
                        },
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isFocused
                          ? "#E5E7EB"
                          : isSelected
                          ? "white"
                          : undefined,
                        color: "#333",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "6px 12px",
                        ":active": { backgroundColor: "#E5E7EB" },
                      }),
                    }}
                  />
                </div>

                {/* Cell 5: Prerequisites */}
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className={`${CourseEditCSS.label}`}>
                    المتطلبات المسبقة
                  </label>
                  <div className={CourseEditCSS.courseDurationTextBarContainer}>
                    <input
                      dir="rtl"
                      type="text"
                      className="courseDurationTextBarContainer"
                      name="prerequisites"
                      value={courseDetails.prerequisites}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="CourseSettings mt-12">
              <div className={CourseEditCSS.CourseDataLabel}>
                إعدادات الدورة
              </div>
              <hr />
              <div className="introVideosAndOtherInputsContainer mt-8 pb-8">
                <div className="introVideosAndOtherInputs flex flex-col justify-between gap-8">
                  <div
                    className={`${CourseEditCSS.introVideosAndOtherInputsRightSide} flex flex-row gap-6 items-center`}
                  >
                    <div
                      className={`${CourseEditCSS.courseDurationContainer} flex flex-col gap-3 w-1/2 justify-end`}
                    >
                      <div className={`${CourseEditCSS.label}`}>نوع الدورة</div>
                      <div>
                        <div
                          className={`${CourseEditCSS.CourseTypeCheckContainer} flex flex-row justify-end gap-8`}
                        >
                            <label
                              htmlFor="course-free"
                              className="inline-flex gap-1 items-baseline"
                            >
                              <input
                                id="course-free"
                                type="radio"
                                name="isPaid"
                                value="false"
                                checked={!courseDetails.isPaid}
                                onChange={() => setCourseDetails(prev => ({ ...prev, isPaid: false }))}
                              />
                              {CourseTypeLabels.free}
                            </label>

                            <label
                              htmlFor="course-paid"
                              className="inline-flex gap-1 items-baseline"
                            >
                              <input
                                id="course-paid"
                                type="radio"
                                name="isPaid"
                                value="true"
                                checked={courseDetails.isPaid}
                                onChange={() => setCourseDetails(prev => ({ ...prev, isPaid: true }))}
                              />
                              {CourseTypeLabels.paid}
                            </label>
                        </div>
                      </div>
                    </div>

                    <div className={`${CourseEditCSS.label} w-1/2`}>
                      <label className={CourseEditCSS.checkboxContainer}>
                        متاحة للجميع
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={() => setIsFeatured(!isFeatured)}
                        />
                      </label>
                    </div>
                  </div>

                  {courseDetails.isPaid && (
                    <div
                      className={`${CourseEditCSS.introVideosAndOtherInputsRightSide} flex flex-row gap-6`}
                    >
                      <div
                        className={`${CourseEditCSS.courseDurationContainer} flex flex-col gap-1.5 w-1/2`}
                      >
                        <div className={`${CourseEditCSS.label}`}>
                          السعر بعد التخفيض
                        </div>
                        <div
                          className={`${CourseEditCSS.courseDurationTextBarContainer}`}
                        >
                          <input dir="rtl" type="number" name="discountedPrice" value={courseDetails.discountedPrice??''} onChange={handleInputChange}/>
                        </div>
                      </div>

                      <div className="courseTitleContainer flex flex-col w-1/2 gap-1.5">
                        <div className={`${CourseEditCSS.label}`}>
                          السعر الأصلي
                        </div>
                        <div
                          className={`${CourseEditCSS.courseDurationTextBarContainer}`}
                        >
                          <input dir="rtl" type="number" name="originalPrice" value={courseDetails.originalPrice??''} onChange={handleInputChange}/>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="w-full flex justify-end">
                    <div
                      className={`${CourseEditCSS.maxNumberOfStudents} flex flex-col gap-1.5`}
                    >
                      <div className={`${CourseEditCSS.label}`}>
                        الحد الأقصي للطلاب
                      </div>
                      <div
                        className={`${CourseEditCSS.courseDurationTextBarContainer}`}
                      >
                        <input
                          dir="rtl"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          onInput={(e) => {
                            const onlyDigits = e.currentTarget.value.replace(
                              /\D/g,
                              ""
                            );
                            e.currentTarget.value = onlyDigits;
                          }}
                          value={courseDetails.maxStudents??''}
                          onChange={handleInputChange}
                          name="maxStudents"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className={CourseEditCSS.addCourseDiv}>
              <button onClick={handleSubmit} disabled={isSubmitting}>
                <img
                  src="/assets/imgs/plus_svgrepo_com.svg"
                  alt="Plus Icon"
                  className={`${CourseEditCSS.plusIcon} w-3`}
                />
                <span>{isSubmitting ? "جاري الإرسال..." : "إضافة الدورة"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {(isAtLeastMd || showSidebar) && (
        <SideBar
          className={
            isAtLeastMd ? "" : "top-0 left-0 z-50 h-full w-4/5 bg-white"
          }
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
