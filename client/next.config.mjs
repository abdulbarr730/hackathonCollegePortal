/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            // local: proxy /api/* to local backend
            source: "/api/:path*",
            destination: "http://localhost:5000/api/:path*",
          },
        ]
      : [
          {
            // prod: proxy /api/* to Render backend
            source: "/api/:path*",
            destination:
              "https://hackathoncollegeportal-server.onrender.com/api/:path*",
          },
        ];
  },
};
export default nextConfig;