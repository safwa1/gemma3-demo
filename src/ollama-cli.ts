import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface OllamaModel {
    name: string;
    id: string;
    size: string;
    modified: string;
}

export async function getOllamaModels(): Promise<string[]> {
    try {
        const { stdout, stderr } = await execAsync('ollama list');

        if (stderr) {
            console.warn('Warning from ollama command:', stderr);
        }

        const lines = stdout.trim().split('\n');

        const models: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                // Split by whitespace and take the first column (NAME)
                const columns = line.split(/\s+/);
                if (columns.length > 0) {
                    models.push(columns[0]);
                }
            }
        }

        return models;
    } catch (error) {
        console.error('Error executing ollama list command:', error);
        throw new Error(`Failed to get ollama models: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function getOllamaModelsDetailed(): Promise<OllamaModel[]> {
    try {
        const { stdout, stderr } = await execAsync('ollama list');

        if (stderr) {
            console.warn('Warning from ollama command:', stderr);
        }

        const lines = stdout.trim().split('\n');
        const models: OllamaModel[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const columns = line.split(/\s+/);
                if (columns.length >= 4) {
                    models.push({
                        name: columns[0],
                        id: columns[1],
                        size: columns[2],
                        modified: columns.slice(3).join(' ') // Handle spaces in modified date
                    });
                }
            }
        }

        return models;
    } catch (error) {
        console.error('Error executing ollama list command:', error);
        throw new Error(`Failed to get ollama models: ${error instanceof Error ? error.message : String(error)}`);
    }
}
