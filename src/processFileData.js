import fs from 'fs-extra';

export const getFileData = async filePath => {
  const isAvailablePath = await fs.pathExists(filePath);
  console.log('isAvailablePath', isAvailablePath);
  if (!isAvailablePath) {
    return {}; // Return {} if file does not exist
  }

  try {
    return await fs.readJson(filePath);
  } catch (error) {
    console.error('Error reading file:', error);
    return {}; // Return {} on any read error
  }
};

export const writeFileData = async (filePath, data) => {
  try {
    await fs.ensureFile(filePath); // Ensure file and directory exist
    await fs.writeJson(filePath, data, { spaces: 2 }); // Write JSON with formatting
    console.log('File written successfully!');
  } catch (error) {
    console.error('Error writing file:', error);
  }
};
