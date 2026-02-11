/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    // CHANGED THIS TO 5001
    const backendUrl = isDev 
      ? "http://127.0.0.1:5001" 
      : "https://hackathoncollegeportal-server.onrender.com";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`, // Ensure backendUrl is just the domain
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;