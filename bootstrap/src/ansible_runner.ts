import * as child from 'child_process';
import * as path from 'path';

import { IEnvironmentDefinition } from './manager.environment';
import { ScriptRunner } from './script_runner';

export type PlaybooksT = "init-host" | "upload-files";

export class AnsibleRunner {
  static RunPlaybook(environment: IEnvironmentDefinition, playbook: PlaybooksT, verbose: boolean = false): Promise<void> {
    const ansiblePath = path.normalize(path.join(path.normalize(__dirname), '../ansible'));

    const skipVolumes = (playbook === "init-host");

    const inventoryScript = skipVolumes ? `${environment.environmentName}-inventory-no-volumes.sh` : `${environment.environmentName}-inventory.sh`;
    const inventoryPath = path.join(ansiblePath, inventoryScript);
    const playbookPath = path.join(ansiblePath, `${playbook}.yaml`);

    let runner = new AnsibleRunner('/usr/bin/ansible-playbook', inventoryPath, playbookPath);
    runner.verbose = verbose;

    return runner.exec().then(() => {});
  }

  public verbose: boolean = false; 

  private constructor(
    private _ansiblePath: string,
    private _inventoryPath: string,
    private _playbookPath: string) {  }


  public exec(): Promise<string> {
    let fullCommand = `${this._ansiblePath} -i ${this._inventoryPath} ${this._playbookPath}`;

    return ScriptRunner.MakeRunner()
      .then((scriptRunner) => {
        scriptRunner.echoOutput = this.verbose;

        scriptRunner.setEnvironmentVariable('ANSIBLE_HOST_KEY_CHECKING', 'False');
        return scriptRunner.exec(fullCommand);
      });
  }
}