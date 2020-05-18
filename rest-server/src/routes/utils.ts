import debug from 'debug';
import { Swagger } from '../interfaces/swagger';

export function extendPaths(pathStart: string, existingSwagger: Swagger): Swagger {
    const newSwagger = {} as Swagger;

    if (existingSwagger.hasOwnProperty('paths')) {
        newSwagger.paths = {};
        for (const path in existingSwagger.paths) {
            if (existingSwagger.paths.hasOwnProperty(path)) {
                newSwagger.paths[`/${pathStart}${path}`] = existingSwagger.paths[path];
            }
        }
    }

    if (existingSwagger.hasOwnProperty('components')) {
        newSwagger.components = {
            schemas: {},
        };

        for (const component in existingSwagger.components.schemas) {
            if (existingSwagger.components.schemas.hasOwnProperty(component)) {
                newSwagger.components.schemas[pathStart + '.' + component] = existingSwagger.components.schemas[component];

                // Update ref paths to new component paths, only pass new swagger as just want paths updating
                extendRefs(pathStart, component, newSwagger);
            }
        }
    }

    return newSwagger;
}

function extendRefs(pathStart: string, component: string, json: object) {
    Object.entries(json).forEach(([key, val]) => {
        if (typeof val === 'object' && !Array.isArray(val)) {
            extendRefs(pathStart, component, val);
        } else if (key === '$ref') {
            json[key] = json[key].replace(`#/components/schemas/${component}`, `#/components/schemas/${pathStart}.${component}`);
        }
    });
}
