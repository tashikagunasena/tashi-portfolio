import { useState, useRef, useEffect } from "react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { WindowControls } from "#components";
import { techStack } from "#constants/index.js";

// Dynamically build the "skills" folder from your actual constants
const generateSkillsFS = () => {
  const skillsChildren = {};
  techStack.forEach(({ category, items }) => {
    const fileName = `${category.toLowerCase().replace(/\s+/g, "-")}.txt`;
    skillsChildren[fileName] = {
      type: "file",
      content: items.join(", "),
    };
  });
  return skillsChildren;
};

// The mock file system
const FS = {
  "~": {
    type: "dir",
    children: {
      "about.txt": {
        type: "file",
        content:
          "Hey! I'm Tashi. Welcome to my interactive terminal.\nFeel free to look around, or type 'help' to see what you can do.",
      },
      skills: {
        type: "dir",
        children: generateSkillsFS(),
      },
      projects: {
        type: "dir",
        children: {
          "portfolio.txt": {
            type: "file",
            content:
              "This very macOS-inspired portfolio you are using right now.",
          },
          "saas.txt": {
            type: "file",
            content: "A cool SaaS dashboard built with Next.js and Tailwind.",
          },
        },
      },
      "secret.txt": {
        type: "file",
        content:
          "You found the secret file. Try running 'rm -rf /' ... if you dare.",
      },
    },
  },
};

const EMOJIS = ["\\(o_o)/", "(˚Δ˚)b", "(^-^*)", "(‵′)", "\\(°ˊДˋ°)/"];
const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";

const MatrixRain = ({ onClose }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // ✅ FIX: Use a lazy initializer function inside useState.
  // It runs exactly once on mount, preventing the cascading render warning.
  const [emoji] = useState(
    () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#2e9244";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []); // Now this effect purely handles the external canvas system

  return (
    <div ref={containerRef} className="matrix-container" onClick={onClose}>
      <canvas ref={canvasRef} className="matrix-canvas" />
      <div className="matrix-text">
        <div className="text-4xl">{emoji}</div>
        <div className="text-3xl font-bold">HOW DARE YOU!</div>
        <div className="text-sm opacity-70 mt-2">
          Click anywhere to restore the system
        </div>
      </div>
    </div>
  );
};

const Terminal = () => {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [curPath, setCurPath] = useState(["~"]);
  const [rmrf, setRmrf] = useState(false);

  const inputRef = useRef(null);
  const termBodyRef = useRef(null);
  const idRef = useRef(0);

  const getCurDir = () => {
    let node = FS["~"];
    for (let i = 1; i < curPath.length; i++) {
      node = node.children[curPath[i]];
    }
    return node;
  };

  const addLine = (content, type = "result") => {
    setLines((prev) => [...prev, { id: idRef.current++, content, type }]);
  };

  const processCommand = (cmdStr) => {
    const parts = cmdStr.trim().split(" ");
    const cmd = parts[0];
    const arg = parts[1];

    addLine(
      <span className="term-prompt">
        @tashi <span className="term-path">{curPath.join("/")}</span>{" "}
        <span className="term-arrow">&gt;</span> {cmdStr}
      </span>,
      "input",
    );

    if (cmdStr.startsWith("rm -rf")) {
      setRmrf(true);
      return;
    }

    switch (cmd) {
      case "help":
        addLine(
          <ul className="term-help">
            <li>
              <span className="term-cmd">ls</span> - list directory contents
            </li>
            <li>
              <span className="term-cmd">cd &lt;dir&gt;</span> - change
              directory (use 'cd ..' to go up)
            </li>
            <li>
              <span className="term-cmd">cat &lt;file&gt;</span> - display file
              contents
            </li>
            <li>
              <span className="term-cmd">clear</span> - clear the terminal
              screen
            </li>
            <li>
              <span className="term-cmd">help</span> - show this help message
            </li>
          </ul>,
        );
        break;
      case "clear":
        setLines([]);
        break;
      case "ls": {
        const dir = getCurDir();
        const items = Object.keys(dir.children).map((name) => (
          <span
            key={name}
            className={
              dir.children[name].type === "dir" ? "term-dir" : "term-file"
            }
          >
            {name}
          </span>
        ));
        addLine(<div className="term-ls">{items}</div>);
        break;
      }
      case "cd":
        if (!arg || arg === "~") {
          setCurPath(["~"]);
        } else if (arg === ".") {
          // stay
        } else if (arg === "..") {
          if (curPath.length > 1) setCurPath((prev) => prev.slice(0, -1));
        } else {
          const curDir = getCurDir();
          if (curDir.children[arg] && curDir.children[arg].type === "dir") {
            setCurPath((prev) => [...prev, arg]);
          } else {
            addLine(
              <span className="term-error">
                cd: no such file or directory: {arg}
              </span>,
            );
          }
        }
        break;
      case "cat": {
        if (!arg) {
          addLine(
            <span className="term-error">cat: missing file operand</span>,
          );
          break;
        }
        const catDir = getCurDir();
        if (catDir.children[arg] && catDir.children[arg].type === "file") {
          addLine(
            <span className="term-file-content">
              {catDir.children[arg].content}
            </span>,
          );
        } else {
          addLine(
            <span className="term-error">
              cat: {arg}: No such file or directory
            </span>,
          );
        }
        break;
      }
      default:
        addLine(
          <span className="term-error">zsh: command not found: {cmd}</span>,
        );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      processCommand(input);
      if (input.trim()) setHistory((prev) => [input, ...prev]);
      setHistoryIdx(-1);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.split(" ");
      const cmd = parts[0];
      const arg = parts[1];

      if (!arg) {
        const cmds = ["ls", "cd", "cat", "clear", "help"];
        const match = cmds.find((c) => c.startsWith(cmd));
        if (match) setInput(match);
      } else if (cmd === "cd" || cmd === "cat") {
        const dir = getCurDir();
        const type = cmd === "cd" ? "dir" : "file";
        const match = Object.keys(dir.children).find(
          (name) => name.startsWith(arg) && dir.children[name].type === type,
        );
        if (match) setInput(`${cmd} ${match}`);
      }
    }
  };

  const focusInput = () => inputRef.current?.focus();

  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [lines]);

  if (rmrf) {
    return (
      <>
        <div id="window-header">
          <WindowControls target="terminal" />
          <h2>Terminal — zsh</h2>
          <div className="w-14" />
        </div>
        <div className="term-body-wrapper">
          <MatrixRain onClose={() => setRmrf(false)} />
        </div>
      </>
    );
  }

  return (
    <>
      <div id="window-header">
        <WindowControls target="terminal" />
        <h2>Terminal — zsh</h2>
        <div className="w-14" />
      </div>
      <div className="term-body-wrapper" ref={termBodyRef} onClick={focusInput}>
        <div className="term-body">
          <div className="term-welcome">
            Last login: {new Date().toDateString()} on ttys001
            <br />
            Welcome to Tashi's interactive terminal. Type{" "}
            <span className="term-cmd">help</span> to get started.
          </div>
          {lines.map((line) => (
            <div key={line.id} className={`term-line term-line-${line.type}`}>
              {line.content}
            </div>
          ))}
          <div className="term-line term-line-input">
            <span className="term-prompt">
              @tashi <span className="term-path">{curPath.join("/")}</span>{" "}
              <span className="term-arrow">&gt;</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              className="term-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck="false"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </>
  );
};

const TerminalWindow = WindowWrapper(Terminal, "terminal");
export default TerminalWindow;
