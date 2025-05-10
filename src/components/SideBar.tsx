import sideBar from '@/../public/styles/sideBar.module.css'
import { useState } from 'react'

interface Menu {
  label: string
  icon: string
  subpages: string[]
}

const menus: Menu[] = [
  {
    label: 'الرئيسية',
    icon: '/home.svg',
    subpages: []
  },
  {
    label: 'الدورات',
    icon: '/courses.svg',
    subpages: [
      'إدارة الدورات',
      'إضافة دورة',
      'التصنيفات'
    ]
  },
  {
    label: 'المهام',
    icon: '/tasks.svg',
    subpages: []
  },
  {
    label: 'الطلاب',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'تسجيل الطلاب',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'الجوائز',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'البطولات',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'الأعضاء',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'الدردشات',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
  {
    label: 'الرسائل',
    icon: '/students.svg',
    subpages: [
      'قائمة الطلاب',
      'تسجيل طالب جديد'
    ]
  },
]

interface SideBarProps {
  className?: string;
  onClose?: () => void;
}

export default function SideBar({ className = "", onClose }: SideBarProps) {
  // `Record<string, boolean>` tells TS that keys are strings, values are booleans
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(
    () =>
      menus.reduce((acc, m) => {
        acc[m.label] = false
        return acc
      }, {} as Record<string, boolean>)
  )

  // explicitly type `label` as string
  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }
  console.log(className)

  return (
    <div className={`${sideBar.sideBar}`}>
    <div className={`${sideBar.sideBarContainer} ${className?`${className}`:"w-full"}`}>
      {className!=='' && (
        <button
          onClick={onClose}
          className="absolute top-4 text-white text-3xl font-extrabold"
          aria-label="Close sidebar"
        >
          ×
        </button>
      )}
      <div className="sidebarContents flex flex-col gap-4 items-center pt-4 w-full h-fit">
        <div className="controlPanal">لوحة التحكم</div>
        <hr className={`${sideBar.hrClass}`} />
        <div className="sideBarPagesContainer flex flex-col gap-6 justify-end w-full h-fit pr-4 pl-4 pb-8">

          {menus.map(menu => (
            <div key={menu.label} className="w-full flex flex-col gap-4">

              {/* Top‑level menu row */}
              <div
                className={`sidebarPage flex flex-row gap-2 justify-${menu.subpages.length > 0 ? 'between' : 'end'} w-full cursor-pointer items-center`}
                onClick={() =>
                  menu.subpages.length > 0 && toggleMenu(menu.label)
                }
              >
                {menu.subpages.length > 0 && (
                  <div className={`${sideBar.sidebarPageArrow} w-2.5 h-2.5`}>
                    {openMenus[menu.label] ? (
                      <img src="/down-arrow-svgrepo-com.svg" alt="إخفاء" />
                    ) : (
                      <img src="/right-arrow-svgrepo-com.svg" alt="عرض" />
                    )}
                  </div>
                )}

                <div className="sidebarPageLabelAndIcon flex flex-row gap-2 justify-end items-center">
                  <div className={sideBar.sidebarPageLabel}>
                    {menu.label}
                  </div>
                  <div className="sidebarPageIcon">
                    <img src={menu.icon} alt="" />
                  </div>
                </div>
              </div>

              {/* Subpages */}
              {menu.subpages.length > 0 && openMenus[menu.label] && (
                <div className="hiddenPages flex flex-col gap-4 pr-1.5">
                  {menu.subpages.map(sub => (
                    <div
                      key={sub}
                      className="sidebarPage flex flex-row gap-2 justify-end w-full cursor-pointer items-center"
                    >
                      <div className={sideBar.sidebarHiddenPageLabel}>
                        {sub}
                      </div>
                      <div className="sidebarPageIcon">
                        {/* optional icon */}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}

        </div>
      </div>
    </div>
    </div>
  )
}
