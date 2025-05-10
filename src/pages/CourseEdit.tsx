// React core
import { useState, useEffect } from "react";
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
import AttachmentUploader from "../components/AttachmentUploader";
import RichTextEditor from "../components/RichTextEditor";
import SideBar from "@/components/SideBar";

// Styles
import CourseEditCSS from "../../public/styles/courseEdit.module.css";

interface options {
  value: string;
  label: string;
}

const TeachersNames: options[] = [
  { value: "Ahmed", label: "Ahmed" },
  { value: "Mohamed", label: "Mohamed" },
  { value: "Ahmed123", label: "Ahmed123" },
  { value: "Mohamed23423", label: "Mohamed23423" },
];

const Levels: options[] = [
  { value: "كل المستويات", label: "كل المستويات" },
  { value: "المستوي الاول", label: "المستوي الاول" },
  { value: "المستوي الثاني", label: "المستوي الثاني" },
  { value: "المستوي الثالث", label: "المستوي الثالث" },
];

const videoTypeMap: { [key: string]: string[] } = {
  MP4: ["video/mp4"],
  MKV: ["video/x-matroska"],
  يوتيوب: [],
  مضمن: [],
  "رابط خارجي": [],
};

const IntroVideos: options[] = [
  { value: "لا يوجد", label: "لا يوجد" },
  { value: "MP4", label: "MP4" },
  { value: "MKV", label: "MKV" },
  { value: "يوتيوب", label: "يوتيوب" },
  { value: "مضمن", label: "مضمن" },
  { value: "رابط خارجي", label: "رابط خارجي" },
];

type CourseTypeRadio = "free" | "paid";
const CourseType: CourseTypeRadio[] = ["free", "paid"];
const CourseTypeLabels: Record<CourseTypeRadio, string> = {
  free: "مجانية",
  paid: "مدفوعة",
};

export default function CourseEdit() {
  const [courseCategories, setCourseCategories] = useState<options[]>([
    { value: "uncategorized", label: "بدون تصنيف" },
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [addCategory, setAddCategory] = useState("أسم التصنيف");
  const [selectedCourseTitleOption, setselectedCourseTitleOption] =
    useState<options | null>(courseCategories[0]);
  const [selectedTeacherNameOption, setselectedTeacherNameOption] =
    useState<options | null>(TeachersNames[0]);
  const isAtLeastMd = useMediaQuery({ minWidth: 768 });
  const [selectedLevel, setselectedLevel] = useState<options | null>(Levels[0]);
  const [selectedStartingVideos, setselectedStartingVideos] =
    useState<options | null>(IntroVideos[0]);
  const [courseType, setCourseType] = useState<CourseTypeRadio>("free");
  const [isFeatured, setIsFeatured] = useState(false);

  const createHandleChange = (
    setter: React.Dispatch<React.SetStateAction<options | null>>
  ) => {
    return (opt: SingleValue<options>) => {
      setter(opt);
    };
  };

  useEffect(() => {
    if (!isAtLeastMd && showSidebar) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    // clean-up if component unmounts
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
                <div
                  className={`${CourseEditCSS.courseClassificationDropdownContainer} md:w-fit w-full flex justify-end`}
                >
                  <div className=" w-32">
                    <Select
                      classNamePrefix="react-select"
                      value={selectedCourseTitleOption}
                      onChange={createHandleChange(
                        setselectedCourseTitleOption
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
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmed = addCategory.trim();
                          if (!trimmed) return;
                          const newCat = { value: trimmed, label: trimmed };
                          setCourseCategories((cats) => [...cats, newCat]);
                          setselectedCourseTitleOption(newCat);
                          setAddCategory("");
                          setIsDialogOpen(false);
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
                        </div>
                        <DialogFooter className="flex justify-center! w-full">
                          <Button type="submit" className="flex justify-center">
                            أضف التصنيف
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
                  <input dir="rtl" type="text" />
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
              <div>
                <Select
                  classNamePrefix="react-select"
                  value={selectedTeacherNameOption}
                  onChange={createHandleChange(setselectedTeacherNameOption)}
                  options={TeachersNames}
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

            <div
              className={`${CourseEditCSS.prominentImageContainer} flex flex-col gap-1.5 mt-8`}
            >
              <div className={`${CourseEditCSS.label}`}>صورة بارزة</div>
              <AttachmentUploader />
            </div>

            <div className="introVideosAndOtherInputsContainer mt-16 pb-8">
              <div className="introVideosAndOtherInputs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {/* Cell 1: Intro video selector + uploader */}
                {isAtLeastMd && (
                  <div className="flex justify-center items-center">
                    {selectedStartingVideos?.value !== "لا يوجد" && (
                      <VideoUploader
                        acceptedTypes={
                          videoTypeMap[selectedStartingVideos?.value || "MP4"]
                        }
                        maxFiles={1}
                        maxSize={2000}
                      />
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
                    onChange={createHandleChange(setselectedStartingVideos)}
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
                      <VideoUploader
                        acceptedTypes={
                          videoTypeMap[selectedStartingVideos?.value || "MP4"]
                        }
                        maxFiles={1}
                        maxSize={2000}
                      />
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
                    />
                  </div>
                </div>

                {/* Cell 4: Level */}
                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className={`${CourseEditCSS.label}`}>المستوي</label>
                  <Select
                    classNamePrefix="react-select"
                    value={selectedLevel}
                    onChange={createHandleChange(setselectedLevel)}
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
                          {CourseType.map((type) => (
                            <label
                              key={type}
                              htmlFor={`course-${type}`}
                              className="inline-flex gap-1 items-baseline"
                            >
                              <input
                                id={`course-${type}`}
                                type="radio"
                                name="courseType"
                                value={type}
                                checked={courseType === type}
                                onChange={() => setCourseType(type)}
                              />
                              {CourseTypeLabels[type]}
                            </label>
                          ))}
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

                  {courseType === "paid" && (
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
                          <input dir="rtl" type="number" />
                        </div>
                      </div>

                      <div className="courseTitleContainer flex flex-col w-1/2 gap-1.5">
                        <div className={`${CourseEditCSS.label}`}>
                          السعر الأصلي
                        </div>
                        <div
                          className={`${CourseEditCSS.courseDurationTextBarContainer}`}
                        >
                          <input dir="rtl" type="number" />
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
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className={CourseEditCSS.addCourseDiv}>
              <button>
                <img
                  src="/assets/imgs/plus_svgrepo_com.svg"
                  alt="Plus Icon"
                  className={`${CourseEditCSS.plusIcon} w-3`}
                />
                <span>إضافة الدورة</span>
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
