import PostCard from "../components/PostCard.jsx";
import posts from "../data/posts.js";

function Blog() {
  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">Blog</span>
        <h1>Habits & mindset</h1>
        <p className="page-header__lede">
          Notes on the systems, routines, and small decisions that make the
          training and the cooking — and everything else — possible.
        </p>
      </section>

      <section className="section container">
        <h2 className="sr-only">All posts</h2>
        <div className="card-grid">
          {posts.map((post) => (
            <PostCard post={post} key={post.id} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Blog;
