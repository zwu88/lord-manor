function installErrorMonitor(page) {
  const errors = [];
  const allowedConsoleMessages = [];

  page.on("pageerror", error => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", message => {
    if (message.type() !== "error") {
      return;
    }

    const text = message.text();

    if (
      allowedConsoleMessages.some(pattern =>
        pattern instanceof RegExp ? pattern.test(text) : pattern === text
      )
    ) {
      return;
    }

    errors.push(`console.error: ${text}`);
  });

  return {
    assertNoErrors() {
      if (errors.length > 0) {
        throw new Error(`Unexpected browser errors:\n${errors.join("\n")}`);
      }
    }
  };
}

module.exports = {
  installErrorMonitor
};
