import type { FC, PropsWithChildren } from "react";
import { AddPortProvider, type AddPortProviderProps } from "./add-port";
import {
	DeletePortProvider,
	type DeletePortProviderProps,
} from "./delete-port";
import { KnowledgeProvider, type KnowledgeProviderProps } from "./knowledges";
import {
	UpdateNodeProvider,
	type UpdateNodeProviderProps,
} from "./update-node";
import {
	UpdatePortProvider,
	type UpdatePortProviderProps,
} from "./update-port";

type OperationProviderProps = {
	addPort: AddPortProviderProps["addPort"];
	updatePort: UpdatePortProviderProps["updatePort"];
	deletePort: DeletePortProviderProps["deletePort"];
	updateNode: UpdateNodeProviderProps["updateNode"];
	knowledges: KnowledgeProviderProps["knowledges"];
};

export const OperationProvider: FC<
	PropsWithChildren<OperationProviderProps>
> = ({ children, addPort, updateNode, deletePort, updatePort, knowledges }) => {
	return (
		<UpdateNodeProvider updateNode={updateNode}>
			<AddPortProvider addPort={addPort}>
				<UpdatePortProvider updatePort={updatePort}>
					<DeletePortProvider deletePort={deletePort}>
						<KnowledgeProvider knowledges={knowledges}>
							{children}
						</KnowledgeProvider>
					</DeletePortProvider>
				</UpdatePortProvider>
			</AddPortProvider>
		</UpdateNodeProvider>
	);
};
