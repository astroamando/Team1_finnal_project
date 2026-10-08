const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const getCallbackUrl = (req) =>
  process.env.CALLBACK_URL ||
  `${req.protocol}://${req.get("host")}/auth/github/callback`;

// Start GitHub OAuth
router.get("/github", (req, res, next) => {
  try {
    //#swagger.tags=["Auth"]

    if (!process.env.GITHUB_CLIENT_ID) {
      throw createError(500, "GITHUB_CLIENT_ID is not configured.");
    }

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: getCallbackUrl(req),
      scope: "read:user",
    });

    res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});

// GitHub OAuth callback
router.get("/github/callback", async (req, res, next) => {
  try {
    //#swagger.tags=["Auth"]

    const { code } = req.query;

    if (!code) {
      throw createError(400, "Missing OAuth code parameter.");
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw createError(500, "GitHub OAuth is not configured.");
    }

    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      throw createError(
        401,
        `GitHub OAuth failed: ${
          tokenData.error_description || tokenData.error || "No access token returned."
        }`,
      );
    }

    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Team1-Library-API",
      },
    });

    if (!userResponse.ok) {
      throw createError(
        401,
        "GitHub OAuth failed: unable to fetch the GitHub user.",
      );
    }

    const githubUser = await userResponse.json();

    const user = {
      githubId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
    };

    res.status(200).json({
      message:
        "GitHub OAuth login successful. Use the OAuth access token as 'Bearer <token>' on protected endpoints.",
      accessToken: tokenData.access_token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// Get authenticated GitHub user
router.get("/user", requireAuth, (req, res) => {
  //#swagger.tags=["Auth"]

  res.status(200).json({
    user: req.user,
  });
});

// Logout
router.get("/logout", (req, res) => {
  //#swagger.tags=["Auth"]

  res.status(200).json({
    message:
      "Logged out. Remove the GitHub OAuth access token from the client.",
  });
});

module.exports = router;