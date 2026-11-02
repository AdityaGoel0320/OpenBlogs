import { lazy, Suspense, useContext, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
const Home = lazy(() => import("./components/pages/Home"));
const About = lazy(() => import("./components/pages/About"));
const Blogs = lazy(() => import("./components/pages/BlogDirectory"));
const SingleBlog = lazy(() => import("./components/pages/SingleBlog"));
// import Navbar from "../src/components/layout/Navbar";
import Footer from "../src/components/layout/Footer";
import { Toaster } from "react-hot-toast";
const Dashboard = lazy(() => import("./components/pages/Dashboard"));
const Register = lazy(() => import("./components/pages/Register"));
const Login = lazy(() => import("./components/pages/Login"));
const AllAuthors = lazy(() => import("./components/pages/AllAuthors"));

import { Context } from "./main";
import axios from "axios";
const UpdateBlog = lazy(() => import("./components/pages/UpdateBlog"));
const Error404 = lazy(() => import("./components/pages/Error404"));
const AboutUser = lazy(() => import("./components/pages/AboutUser"));
import { BackendUrl } from "./assets/FrontendUtils";
import Navbar from "./components/layout/NavbarModern";
const ParticularAuthorProfile = lazy(() => import("./components/pages/ParticularAuthorProfile"));

const App = () => {
  const { setUser, setIsAuthenticated, setBlogs, setIsAuthLoading } =
    useContext(Context);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        let url = `${BackendUrl}/api/v1/user/myprofile`
        const { data } = await axios.get(

          url,
          {
            withCredentials: true,
          }
        );
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.log(error);
        setIsAuthenticated(false);
        setUser({});
      } finally {
        setIsAuthLoading(false);
      }
    };
    const fetchBlogs = async () => {
      try {
        let url = `${BackendUrl}/api/v1/blog/all`;

        const { data } = await axios.get(url, { withCredentials: true });
        setBlogs(data.allBlogs);
      } catch (error) {
        setBlogs([]);
      }
    };

    fetchUser();
    fetchBlogs();
  }, [setBlogs, setIsAuthenticated, setUser, setIsAuthLoading]);
  return (
    <>


      <BrowserRouter>
        <Navbar />



        <Suspense fallback={<div className="route-loading" role="status">Loading OpenBlogs...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blog/:id" element={<SingleBlog />} />
          <Route path="/about" element={<About />} />
          <Route path="/author/:authorId" element={<ParticularAuthorProfile />} />
          <Route path="/aboutUser" element={<AboutUser />} />
          <Route path="/authors" element={<AllAuthors />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blog/update/:id" element={<UpdateBlog />} />
          <Route path="*" element={<Error404 />} />

        </Routes>
        </Suspense>
        <Footer />
        <Toaster />
      </BrowserRouter>


      {/* <SampleData/> */}

    </>
  );
};

export default App;
