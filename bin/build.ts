#!/usr/bin/env ts-node

/* eslint-disable no-console */

import * as chalk from 'chalk';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

const inform = (...params: Parameters<typeof console.log>) =>
  console.log(...params);
const succeed = (...params: Parameters<typeof console.log>) =>
  console.log(chalk.green(...params));
const error = (...params: Parameters<typeof console.error>) =>
  console.error(chalk.red(...params));

const currentPath = join(__dirname, '..');

const srcPath = join(currentPath, 'src');
const buildPath = join(currentPath, 'build');

const makeRelative = (path: string) => path.replace(currentPath, '');

const compile = ({
  src,
  path,
  name,
}: {
  src: string;
  path: string;
  name: string;
}) => {
  const [, ...nameParts] = name.split('.').reverse();
  const command = `dot ${src} -T svg -o ${join(
    path,
    nameParts.reverse().join('.'),
  )}.svg`;
  inform('Executing', command);

  return exec(command, (err) => {
    if (err) {
      error('Error compiling', join(path, name));
    } else {
      succeed('Compiled', makeRelative(join(path, name)));
    }
  });
};

const compileDir = (path: string) =>
  fs.readdir(path, { withFileTypes: true }).then((dirents) => {
    inform('Compiling', dirents.length, 'root files.');

    dirents.forEach((dirent) => {
      if (dirent.isFile()) {
        const outputPath = path.replace(srcPath, buildPath);

        fs.stat(outputPath)
          .then(() => {
            inform('Compiling', makeRelative(join(outputPath, dirent.name)));
            compile({
              src: join(path, dirent.name),
              path: outputPath,
              name: dirent.name,
            });
          })
          .catch(() => {
            inform('Creating dir', makeRelative(outputPath));
            fs.mkdir(outputPath).then(() => {
              compile({
                src: join(path, dirent.name),
                path: outputPath,
                name: dirent.name,
              });
            });
          });
      } else {
        compileDir(join(path, dirent.name));
      }
    });
  });

compileDir(srcPath);
