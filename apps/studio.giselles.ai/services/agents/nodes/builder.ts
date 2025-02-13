import type { BaseSchema } from "valibot";
import type {
	DefaultPort,
	DefaultPorts,
	NodeClass,
	NodeClassCategory,
	NodeClassOptions,
	PortType,
} from "./types";

type CreatePortArgs<TType extends PortType, TName extends string> = {
	name: TName;
	type: TType;
};
export function buildDefaultPort<TType extends PortType, TName extends string>(
	args: CreatePortArgs<TType, TName>,
): DefaultPort<TName> {
	return args;
}

/**
 * Constructs a NodeClass object with the specified name and options.
 *
 * @param nodeName - The name of the node class.
 * @param options - The options to configure the node class. Includes categories, default ports, data schema, render panel, action, and resolver.
 * @returns The constructed NodeClass object.
 */
export function buildNodeClass<
	NodeName extends string,
	TNodeClassCategories extends NodeClassCategory[],
	// biome-ignore lint: lint/suspicious/noExplicitAny
	TDefaultPorts extends DefaultPorts<any, any>,
	// biome-ignore lint: lint/suspicious/noExplicitAny
	DataSchema extends BaseSchema<any, any, any> = any,
>(
	nodeName: NodeName,
	options: NodeClassOptions<TNodeClassCategories, TDefaultPorts, DataSchema>,
): NodeClass<NodeName, TNodeClassCategories, TDefaultPorts, DataSchema> {
	return {
		name: nodeName,
		categories: options.categories,
		defaultPorts: options.defaultPorts,
		dataSchema: options.dataSchema,
		renderPanel: options.renderPanel,
		action: options.action,
		resolver: options.resolver,
		afterCreate: options.afterCreate,
	};
}
