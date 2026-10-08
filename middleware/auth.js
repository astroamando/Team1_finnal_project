const GITHUB_USER_URL = "https://api.github.com/user";

const requireAuth = async (req, res, next) => {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message:
        "Unauthorized: provide your GitHub OAuth access token as 'Bearer <token>'.",
    });
  }

  try {
    const response = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Team1-Library-API",
      },
    });

    if (!response.ok) {
      return res.status(401).json({
        message: "Unauthorized: invalid or expired GitHub OAuth token.",
      });
    }

    const githubUser = await response.json();

    req.user = {
      githubId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
    };

    next();
  } catch (err) {
    console.error("OAuth authentication error:", err);
    return res.status(500).json({
      message: "Authentication service error.",
    });
  }
};

module.exports = { requireAuth };