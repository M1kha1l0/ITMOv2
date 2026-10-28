// OpenCode plugin for Practice 05: runs check.sh after file modifications and verifies test suite

module.exports = {
  id: "practice05.checks",
  setup(ctx) {
    const runCheck = async (event) => {
      try {
        ctx.log.info(`[practice05.checks] Hook triggered on ${event}, running scripts/check.sh...`);
        const res = await ctx.shell.exec({
          cmd: "bash",
          args: ["scripts/check.sh"],
          cwd: ctx.workspace.root,
        });
        const ok = res.code === 0;
        if (ok) {
          ctx.log.info(`[practice05.checks] Tests passed successfully (exit=0).`);
        } else {
          ctx.log.warn(`[practice05.checks] Tests failed with exit=${res.code}! Stderr: ${res.stderr || "none"}`);
        }
        return {
          ok,
          stdout: res.stdout || "",
          stderr: res.stderr || "",
          exitCode: res.code,
        };
      } catch (e) {
        ctx.log.error(`[practice05.checks] Runner execution error: ${e.message}`);
        return { ok: false, stdout: "", stderr: e.message, exitCode: 1 };
      }
    };

    ctx.tool.hook("write:after", async () => runCheck("write:after"));
    ctx.tool.hook("edit:after", async () => runCheck("edit:after"));
    ctx.tool.hook("patch:after", async () => runCheck("patch:after"));
  },
};
