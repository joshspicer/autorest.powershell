/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { deconstruct, pascalCase, Dictionary } from '@microsoft.azure/codegen';
import { SchemaDefinitionResolver, SchemaDetails, LanguageDetails, EnhancedTypeDeclaration, Boolean } from '@microsoft.azure/autorest.csharp-v2';
import { State } from './state';
import { Project as codeDomProject } from '@microsoft.azure/codegen-csharp';
import { SupportNamespace } from './namespaces/support'
import { ModelExtensionsNamespace } from './namespaces/model-extensions'
import { ModelCmdletNamespace } from './namespaces/model-cmdlet'
import { ServiceNamespace } from './namespaces/service'
import { CmdletNamespace } from './namespaces/cmdlet'
import { Host, Channel } from '@microsoft.azure/autorest-extension-base';
import { codemodel, PropertyDetails, exportedModels as T, ModelState, JsonType, } from '@microsoft.azure/autorest.codemodel-v3';

export type Schema = T.SchemaT<LanguageDetails<SchemaDetails>, LanguageDetails<PropertyDetails>>;

export interface Metadata {
  authors: string,
  owners: string,
  requireLicenseAcceptance: boolean,
  description: string,
  copyright: string,
  tags: string,
  companyName: string,
  licenseUrl: string,
  projectUrl: string
}

export class PSSwitch extends Boolean {
  get declaration(): string {
    return `global::System.Management.Automation.SwitchParameter${this.isRequired ? '' : '?'}`;
  }

}

export class PSSchemaResolver extends SchemaDefinitionResolver {

  resolveTypeDeclaration(schema: Schema | undefined, required: boolean, state: ModelState<codemodel.Model>): EnhancedTypeDeclaration {
    if (schema && schema.type === JsonType.Boolean) {
      return new PSSwitch(schema, required);
    }
    return super.resolveTypeDeclaration(schema, required, state);
  }
}

export class Project extends codeDomProject {
  public azure!: boolean;
  public cmdletFolder!: string;
  public modelCmdletFolder!: string;
  public customFolder!: string;
  public internalFolder!: string;
  public testFolder!: string;
  public runtimeFolder!: string;
  public binFolder!: string;
  public objFolder!: string;
  public exportsFolder!: string;
  public docsFolder!: string;
  public examplesFolder!: string;
  public resourcesFolder!: string;
  public serviceName!: string;
  public moduleName!: string;
  public csproj!: string;
  public nuspec!: string;
  public gitIgnore!: string;
  public gitAttributes!: string;
  public readme!: string;
  public dllName!: string;
  public dll!: string;
  public psd1!: string;
  public psm1!: string;
  public psm1Custom!: string;
  public psm1Internal!: string;
  public formatPs1xml!: string;
  public apiFolder!: string;
  public baseFolder!: string;
  public moduleFolder!: string;
  public schemaDefinitionResolver!: SchemaDefinitionResolver;
  public moduleVersion!: string;
  public profiles!: string[];
  public skipModelCmdlets!: boolean;
  public prefix!: string;
  public subjectPrefix!: string;
  public projectNamespace!: string;
  public overrides!: Dictionary<string>;
  public serviceNamespace!: ServiceNamespace;
  public supportNamespace!: SupportNamespace;
  public cmdlets!: CmdletNamespace;
  public modelCmdlets!: ModelCmdletNamespace;
  public modelsExtensions!: ModelExtensionsNamespace;
  public accountsVersionMinimum!: string;
  public dependencyModuleFolder!: string;
  public metadata!: Metadata;
  public state!: State;
  public helpLinkPrefix!: string;
  get model() { return <codemodel.Model>this.state.model };

  constructor(protected service: Host, objectInitializer?: Partial<Project>) {
    super();
    this.apply(objectInitializer);
  }


  public async init(): Promise<this> {
    await super.init();
    this.state = await new State(this.service).init(this);

    this.schemaDefinitionResolver = new PSSchemaResolver();

    this.projectNamespace = this.state.model.details.csharp.namespace;


    this.overrides = {
      'Carbon.Json.Converters': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Internal.Extensions': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Internal': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Data': `${this.projectNamespace}.Runtime.Json`,
      'using Data;': '',
      'using Parser;': '',
      'using Converters;': '',
      'using Internal.Extensions;': '',

      'Carbon.Json.Parser': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Json': `${this.projectNamespace}.Runtime.Json`,
      'Microsoft.Rest.ClientRuntime': `${this.projectNamespace}.Runtime`,
      'Microsoft.Rest': `${this.projectNamespace}`,
    };

    // Values
    this.moduleVersion = await this.state.getValue('module-version');
    this.profiles = this.model.info.extensions['x-ms-metadata'].profiles || [];
    this.accountsVersionMinimum = '1.6.0';
    this.helpLinkPrefix = await this.state.getValue('help-link-prefix');

    // Flags
    this.skipModelCmdlets = true;
    this.azure = this.model.details.default.isAzure;

    // Names
    this.prefix = this.model.details.default.prefix;
    this.serviceName = this.model.details.default.serviceName;
    this.subjectPrefix = this.model.details.default.subjectPrefix;
    this.moduleName = await this.state.getValue('module-name');
    this.dllName = await this.state.getValue('dll-name');

    // Folders
    this.baseFolder = await this.state.getValue('current-folder');
    this.moduleFolder = await this.state.getValue('module-folder');
    this.cmdletFolder = await this.state.getValue('cmdlet-folder');
    this.modelCmdletFolder = await this.state.getValue('model-cmdlet-folder');
    this.customFolder = await this.state.getValue('custom-cmdlet-folder');
    this.internalFolder = await this.state.getValue('internal-cmdlet-folder');
    this.testFolder = await this.state.getValue('test-folder');
    this.runtimeFolder = await this.state.getValue('runtime-folder');
    this.apiFolder = await this.state.getValue('api-folder');

    this.binFolder = await this.state.getValue('bin-folder');
    this.objFolder = await this.state.getValue('obj-folder');
    this.exportsFolder = await this.state.getValue('exports-folder');
    this.docsFolder = await this.state.getValue('docs-folder');
    this.dependencyModuleFolder = await this.state.getValue('dependency-module-folder');
    this.examplesFolder = await this.state.getValue('examples-folder');
    this.resourcesFolder = await this.state.getValue('resources-folder');

    // File paths
    this.csproj = await this.state.getValue('csproj');
    this.dll = await this.state.getValue('dll');
    this.psd1 = await this.state.getValue('psd1');
    this.psm1 = await this.state.getValue('psm1');
    this.psm1Custom = await this.state.getValue('psm1-custom');
    this.psm1Internal = await this.state.getValue('psm1-internal');
    this.formatPs1xml = await this.state.getValue('format-ps1xml');
    this.nuspec = await this.state.getValue('nuspec');
    this.gitIgnore = `${this.baseFolder}/.gitignore`;
    this.gitAttributes = `${this.baseFolder}/.gitattributes`;
    this.readme = `${this.baseFolder}/readme.md`;

    //Metadata
    let defaultMetadata: Metadata = {
      authors: '',
      owners: '',
      requireLicenseAcceptance: false,
      description: '',
      copyright: '',
      tags: '',
      companyName: '',
      licenseUrl: '',
      projectUrl: ''
    };
    let metadataFromConfig = await this.state.getValue<Metadata>('metadata', defaultMetadata);
    this.metadata = Object.assign(defaultMetadata, metadataFromConfig);

    // add project namespace
    this.addNamespace(this.serviceNamespace = new ServiceNamespace(this.state));
    this.addNamespace(this.supportNamespace = new SupportNamespace(this.serviceNamespace, this.state));
    this.addNamespace(this.modelCmdlets = new ModelCmdletNamespace(this.serviceNamespace, this.state));

    this.addNamespace(this.modelsExtensions = new ModelExtensionsNamespace(this.serviceNamespace, <any>this.state.model.schemas, this.state.path('components', 'schemas')));

    // add cmdlet namespace
    this.addNamespace(this.cmdlets = await new CmdletNamespace(this.serviceNamespace, this.state).init());


    if (!this.skipModelCmdlets) {
      this.modelCmdlets.createModelCmdlets();
    }

    // abort now if we have any errors.
    this.state.checkpoint();
    return this;
  }
}
