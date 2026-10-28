// Simple OpenCode plugin that runs check.sh after write/edit/patch and reports the result

module.exports = {
  id: "practice04.checks",
  setup(ctx) {
    const runCheck = async (event) => {
      try {
        const res = await ctx.shell.exec({
          cmd: "bash",
          args: ["scripts/check.sh"],
          cwd: ctx.workspace.root,
        });
        ctx.log.info(`[practice04.checks] ${event} exit=${res.code}`);
        return {
          ok: res.code === 0,
          stdout: res.stdout || "",
          stderr: res.stderr || "",
          exitCode: res.code,
        };
      } catch (e) {
        ctx.log.error(`[practice04.checks] error: ${e.message}`);
        return { ok: false, stdout: "", stderr: e.message, exitCode: 1 };
      }
    };

    ctx.tool.hook("write:after", async () => runCheck("write:after"));
    ctx.tool.hook("edit:after", async () => runCheck("edit:after"));
    ctx.tool.hook("patch:after", async () => runCheck("patch:after"));
  },
};
