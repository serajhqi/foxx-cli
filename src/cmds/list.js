"use strict";
const { bold, gray } = require("chalk");
const { common } = require("../util/cli");
const client = require("../util/client");
const resolveServer = require("../resolveServer");
const { info, json, detail, fatal } = require("../util/log");
const { group } = require("../util/text");

const command = (exports.command = "list [path]");
exports.description = "List mounted services";
const aliases = (exports.aliases = ["ls"]);

const describe = "Shows an overview of all installed services.";

const args = [["path", "Database-relative path of the service"]];

exports.builder = yargs =>
  common(yargs, { command, aliases, describe, args }).options({
    all: {
      describe: "Include system services",
      alias: "a",
      type: "boolean",
      default: false
    },
    raw: {
      describe: "Output raw JSON responses",
      type: "boolean",
      default: false
    }
  });

exports.handler = async function handler(argv) {
  try {
    const server = await resolveServer(argv.path, false);
    const db = client(server);
    let services = await db.listServices();
    if (!argv.all) {
      services = services.filter(service => !service.mount.startsWith("/_"));
    }
    if (argv.raw) {
      json(services);
    } else if (services.length) {
      info(
        group(
          ...services.map(service => [
            service.development ? bold(service.mount) : service.mount,
            prettyVersion(service)
          ])
        )
      );
    } else if (argv.verbose) {
      detail("No services available.");
    }
  } catch (e) {
    fatal(e);
  }
};

function prettyVersion(service) {
  let parts = [];
  if (service.name && service.version) {
    parts.push(`${service.name}@${service.version}`);
  } else {
    if (service.name) parts.push(service.name);
    if (service.version) parts.push(service.version);
  }
  if (service.legacy) parts.push(gray("(legacy)"));
  if (service.development) parts.push(bold("[DEV]"));
  return parts.join(" ");
}