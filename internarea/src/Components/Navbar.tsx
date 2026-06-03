import React, { useEffect, useRef, useState } from 'react';
// import logo from "../Assets/logo.png";
import Link from "next/link";
import {auth,provider} from "../firebase/firebase"
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { selectuser } from '@/Feature/Userslice';
import { useSelector } from 'react-redux';
import axios from 'axios';
import router from 'next/router';

import { useRouter } from 'next/router'; //added

interface User {
    name: string;
    email: string;
    photo: string
}

const Navbar = () => {
    const user=useSelector(selectuser);

    const router = useRouter(); //added

    const handlelogin = async () => {
    try {
    const result = await signInWithPopup(auth, provider);
    const u = result.user;

    const res = await axios.post(
      "https://internshalaclone-jby6.onrender.com/api/auth/record-login",
      { uid: u.uid, email: u.email, name: u.displayName }
    );
    if (res.data.requiresOtp) {
  sessionStorage.setItem("otpPending", "true");  // ← add this line
  router.push("/otpVerification");
}

    if (res.data.requiresOtp) {
      router.push("/otpVerification"); // Chrome → OTP page
    } else {
      toast.success("Logged in successfully");
    }
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast.error("Mobile login only allowed 10 AM – 1 PM");
    } else {
      toast.error("Login failed");
    }
  }
    // setuser({
    //   name: "Rahul",
    //   email: "xyz@gmail.com",
    //   photo:
    //     "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces",
    // });
  };
    const handlelogout = () => {
        signOut(auth)
    };
    // useEffect(()=>{
    //     const handleclickoutside = (event:any)=>{
    //         if(dropdownref.current && !dropdownref.current.contains(event.target)){
    //             setisprofiledropdown(false)
    //         }
    //     }
    //     document.addEventListener('mousedown',handleclickoutside);
    //     return ()=>document.removeEventListener('mousedown',handleclickoutside);
    // },[])

    return <nav className='bg-white shadow-md'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className="flex justify-between h-16 items-center">
                    {/* logo*/}
                    <div className='flex-shrink-0'>
                        <a href="/" className='text-xl font-bold text-blue-600'>
                        <img src={"/logo.png"} alt="logo" className='h-16'/>
                        </a>
                    </div>
                    {/* Navigation Links */}
                    <div className='hidden md:flex items-center space-x-8'>
                        <button className='flex items-center space-x-1 text-gray-700 hover:text-blue-600'>
                            <Link href={"/internship"}>
                                <span>
                                    Internships
                                </span>
                            </Link>
                        </button >
                        <button className='flex items-center space-x-1 text-gray-700 hover:text-blue-600'>
                            <Link href={"/jobs"}>
                                <span>
                                    Jobs
                                </span>
                            </Link>
                        </button>
                        <div className='flex items-center bg-gray-100 rounded-full px-4 py-2'>
                            <Search size={16} className='text-gray-400'/>
                            <input 
                                type="text" 
                                placeholder="Search Opportunities"
                                className='ml-2 bg-transparent focus:outline-none text-sm w-48'
                            />
                        </div>
                    </div>
                    {/* Auth Buttons */}
                <div className='flex items-center space-x-4'>
                    {user ?(
                        <div className='relative flex'>
                        <button className='flex items-center space-x-2' >
                            <Link href={"/profile"}>
                            <img src={user.photo || "/default-user.png"} alt="profile" className='w-8 h-8 rounded-full'/>
                            </Link>
                        </button>
                        <button className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg'
                        onClick={handlelogout}>
                            Logout
                        </button>
                        
                    </div>
                    ):(<>
                    <button 
                    onClick={handlelogin}
                    className='w-full bg-white border border-gray-300 rounded-lg px-2 flex items-center justify-center space-x-2 hover:bg-gray-50'
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                        <span className="text-gray-700">Continue with google</span>
                    </button>
                    {/* <button>
                        <Link href={"/"}>Register</Link>
                    </button> */}
                    <a href='/adminlogin' className='text-gray-600 hover:text-gray-800'>
                    Admin
                    </a>
                    </>)}
                </div>
            </div>
        </div>
    </nav>;
};

export default Navbar
