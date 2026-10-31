import { useContext } from "react";
import StoryGrid from "../miniComponents/StoryGrid";
import FeaturedStory from "../miniComponents/FeaturedStory";
import PopularAuthors from "../miniComponents/PopularAuthors";
import { Context } from "../../main";
import ContactBand from "../miniComponents/ContactBand";

const Home = () => {
  const { mode } = useContext(Context);
  return (

    <>


      <article className={mode === "dark" ? "dark-bg" : "light-bg"}>

        <FeaturedStory />
        {/* <TrendingBlogs /> */}
        <StoryGrid />
        <PopularAuthors />

        <ContactBand />
      </article>
    </>
  );
};

export default Home;
