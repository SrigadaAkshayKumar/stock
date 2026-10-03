import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, realtimeDb } from "./firebase";
import { useAuth } from "./AuthContext";
import { getWatchlistSymbols } from "../utils/watchlistManager";
import BackToTopBtn from "./BackToTopBtn";
import "./Profile.css";

const Profile = () => {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [watchCount, setWatchCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    const userRef = ref(realtimeDb, `users/${user.uid}`);
    get(userRef)
      .then((snap) => {
        const val = snap.val() || {};
        if (val.phone) setPhone(val.phone);
        if (!displayName && val.displayName) setDisplayName(val.displayName);
      })
      .catch(() => {});
    getWatchlistSymbols()
      .then((symbols) => setWatchCount(symbols.length))
      .catch(() => setWatchCount(0));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setNote("");
    try {
      await updateProfile(auth.currentUser, { displayName });
      await set(ref(realtimeDb, `users/${auth.currentUser.uid}`), {
        email: auth.currentUser.email,
        displayName,
        phone,
        updatedAt: new Date().toISOString(),
      });
      setNote("Profile saved.");
    } catch (err) {
      setNote("Could not save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-wrap">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-wrap">
        <h2>Profile</h2>
        <p>You need to log in to view this page.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="profile-wrap">
      <h2>Your Profile</h2>
      <div className="profile-card">
        <p>
          <span>Email:</span> {user.email}
        </p>
        <p>
          <span>Account created:</span>{" "}
          {user.metadata?.creationTime || "Not available"}
        </p>
        <p>
          <span>Last login:</span>{" "}
          {user.metadata?.lastSignInTime || "Not available"}
        </p>
        <p>
          <span>Watchlist items:</span> {watchCount}
        </p>
      </div>

      <form className="profile-card" onSubmit={handleSave}>
        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contact number"
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
        {note && <p className="profile-note">{note}</p>}
      </form>
      <BackToTopBtn />
    </div>
  );
};

export default Profile;
