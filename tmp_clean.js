const fs = require('fs');
const path = require('path');

const dir = 'c:\\velora pure\\src';

function processFile(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    fs.readdirSync(filePath).forEach(f => processFile(path.join(filePath, f)));
  } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/import React, {\s*([^}]+)\s*} from 'react';?/g, "import { $1 } from 'react';");
    newContent = newContent.replace(/import React,\s*{\s*([^}]+)\s*}\s*from 'react';?/g, "import { $1 } from 'react';");
    newContent = newContent.replace(/import React from 'react';?\n/g, "");
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
}

processFile(dir);
