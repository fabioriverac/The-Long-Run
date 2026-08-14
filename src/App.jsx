import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Cooking from "./pages/Cooking.jsx";
import Blog from "./pages/Blog.jsx";
import About from "./pages/About.jsx";
import NotFound from "./pages/NotFound.jsx";

// Lazy-loaded: the Running page pulls in Recharts for its dashboards,
// which is a meaningfully large dependency other pages don't need. This
// keeps that weight out of the initial bundle, loaded only when a visitor
// actually goes to /running.
const Running = lazy(() => import("./pages/Running.jsx"));

// Detail pages are lazy-loaded too — most visits to /cooking or /blog
// never click into a specific recipe/post, so their (currently small, but
// growing) body content shouldn't sit in the initial bundle either.
const RecipeDetail = lazy(() => import("./pages/RecipeDetail.jsx"));
const PostDetail = lazy(() => import("./pages/PostDetail.jsx"));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="running"
          element={
            <Suspense fallback={<div className="container section">Loading…</div>}>
              <Running />
            </Suspense>
          }
        />
        <Route path="cooking" element={<Cooking />} />
        <Route
          path="cooking/:slug"
          element={
            <Suspense fallback={<div className="container section">Loading…</div>}>
              <RecipeDetail />
            </Suspense>
          }
        />
        <Route path="blog" element={<Blog />} />
        <Route
          path="blog/:slug"
          element={
            <Suspense fallback={<div className="container section">Loading…</div>}>
              <PostDetail />
            </Suspense>
          }
        />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
