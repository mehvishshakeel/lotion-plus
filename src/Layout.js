import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import NoteList from "./NoteList";
import { v4 as uuidv4 } from "uuid";
import { currentDate } from "./utils";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";

function Layout() {
  const navigate = useNavigate();
  const mainContainerRef = useRef(null);
  const [collapse, setCollapse] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(-1);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (currentNote < 0) {
      return;
    }
    if (!editMode) {
      navigate(`/notes/${currentNote + 1}`);
      return;
    }
    navigate(`/notes/${currentNote + 1}/edit`);
  }, [notes]);

  // GOOGLE REQUIREMENTS
  const [signedIn, setSignedIn] = useState(
    JSON.parse(localStorage.getItem("profile")) ? true : false
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
      ? JSON.parse(localStorage.getItem("user"))
      : []
  );

  const [profile, setProfile] = useState(
    JSON.parse(localStorage.getItem("profile"))
      ? JSON.parse(localStorage.getItem("profile"))
      : null
  );

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setUser(codeResponse);
      localStorage.setItem("user", JSON.stringify(codeResponse));
      setSignedIn(true);
      console.log(login);
    },
    onError: (error) => console.log("Login Failed:", error),
  });

  // USE EFFECTS
  useEffect(() => {
    if (profile) {
      setAccessToken(user.access_token);
      localStorage.setItem("profile", JSON.stringify(profile));
      getNotes(profile, user.access_token);
    } else {
      navigate("/");
    }
  }, [profile, user]);

  useEffect(() => {
    if (user && user.access_token) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [user]);

  function logOut() {
    googleLogout();
    console.log("log out");
    setProfile(null);
    setSignedIn(false);
    localStorage.removeItem("profile");
  }

  const saveNote = async (note, index) => {
    setEditMode(false);
    note.body = note.body.replaceAll("<p><br></p>", "");
    setNotes([
      ...notes.slice(0, index),
      { ...note },
      ...notes.slice(index + 1),
    ]);
    setCurrentNote(index);
    setEditMode(false);

    const email = profile.email;

    await fetch(
      "https://2cytjwpdvsnqjsghylagwbv6jm0bxvee.lambda-url.ca-central-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...note, email: email }),
      }
    );
  };

  const deleteNote = async (index) => {
    const noteId = notes[index];
    const email = profile.email;

    await fetch(
      "https://lid7lowxpkn2u37vo34butepke0ljnxr.lambda-url.ca-central-1.on.aws/",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: noteId, email: email }),
      }
    );

    setNotes([...notes.slice(0, index), ...notes.slice(index + 1)]);
    setCurrentNote(0);
    setEditMode(false);
  };

  const getNotes = async (profile, aToken) => {
    console.log("In the process of getting notes...");

    const email = profile.email;

    const res = await fetch(
      `https://qlp36h2ljhgcqfxergmgnu4n7q0jxggd.lambda-url.ca-central-1.on.aws/?email=${email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aToken}`,
        },
      }
    );
    const data = await res.json();
    setNotes(data.data);
  };

  const addNote = () => {
    setNotes([
      {
        id: uuidv4(),
        title: "Untitled",
        body: "",
        when: currentDate(),
      },
      ...notes,
    ]);
    setEditMode(true);
    setCurrentNote(0);
  };

  return (
    <div id="LoginPage">
      {/* <header>
        <aside>
          <button id="menu-button" onClick={() => setCollapse(!collapse)}>
            &#9776;
          </button>
        </aside>
        <div id="app-header">
          <h1>
            <Link to="/notes">Lotion</Link>
          </h1>
          <h6 id="app-moto">Like Notion, but worse.</h6>
        </div>
        <aside>&nbsp;</aside>
      </header> */}
      {signedIn ? (
        <div id="sign-in">
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div id="right">
          <button onClick={logOut}>(Sign out)</button>
        </div>
      )}
      <div id="container">
        <header>
          <aside>
            <button id="menu-button" onClick={() => setCollapse(!collapse)}>
              &#9776;
            </button>
          </aside>
          <div id="app-header">
            <h1>
              <Link to="/notes">Lotion</Link>
            </h1>
            <h6 id="app-moto">Like Notion, but worse.</h6>
          </div>
        </header>
        <div id="main-container" ref={mainContainerRef}>
          <aside id="sidebar" className={collapse ? "hidden" : null}>
            <header>
              <div id="notes-list-heading">
                <h2>Notes</h2>
                <button id="new-note-button" onClick={addNote}>
                  +
                </button>
              </div>
            </header>
            <div id="notes-holder">
              <NoteList notes={notes} />
            </div>
          </aside>
          <div id="write-box">
            <Outlet context={[notes, saveNote, deleteNote]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
