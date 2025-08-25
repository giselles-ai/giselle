import { StatusBadge } from "@giselle-internal/ui/status-badge";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	Info,
	MinusCircle,
	XCircle,
} from "lucide-react";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

export default function () {
	return (
		<UiPage title="StatusBadge">
			<DemoSection label="Status Variants">
				<StatusBadge status="success">Success</StatusBadge>
				<StatusBadge status="error">Error</StatusBadge>
				<StatusBadge status="warning">Warning</StatusBadge>
				<StatusBadge status="info">Info</StatusBadge>
				<StatusBadge status="ignored">Ignored</StatusBadge>
			</DemoSection>
			<DemoSection label="With Left Icons">
				<StatusBadge status="success" leftIcon={<CheckCircle />}>
					Success
				</StatusBadge>
				<StatusBadge status="error" leftIcon={<XCircle />}>
					Error
				</StatusBadge>
				<StatusBadge status="warning" leftIcon={<AlertTriangle />}>
					Warning
				</StatusBadge>
				<StatusBadge status="info" leftIcon={<Info />}>
					Info
				</StatusBadge>
				<StatusBadge status="ignored" leftIcon={<MinusCircle />}>
					Ignored
				</StatusBadge>
			</DemoSection>
			<DemoSection label="With Right Icons">
				<StatusBadge status="success" rightIcon={<CheckCircle />}>
					Success
				</StatusBadge>
				<StatusBadge status="error" rightIcon={<AlertCircle />}>
					Alert
				</StatusBadge>
				<StatusBadge status="warning" rightIcon={<AlertTriangle />}>
					Caution
				</StatusBadge>
				<StatusBadge status="info" rightIcon={<Info />}>
					Details
				</StatusBadge>
				<StatusBadge status="ignored" rightIcon={<MinusCircle />}>
					Skip
				</StatusBadge>
			</DemoSection>
			<DemoSection label="With Both Icons">
				<StatusBadge
					status="success"
					leftIcon={<CheckCircle />}
					rightIcon={<CheckCircle />}
				>
					Complete
				</StatusBadge>
				<StatusBadge
					status="error"
					leftIcon={<AlertCircle />}
					rightIcon={<XCircle />}
				>
					Failed
				</StatusBadge>
				<StatusBadge
					status="warning"
					leftIcon={<AlertTriangle />}
					rightIcon={<AlertTriangle />}
				>
					Caution
				</StatusBadge>
				<StatusBadge status="info" leftIcon={<Info />} rightIcon={<Info />}>
					Information
				</StatusBadge>
				<StatusBadge
					status="ignored"
					leftIcon={<MinusCircle />}
					rightIcon={<MinusCircle />}
				>
					N/A
				</StatusBadge>
			</DemoSection>
			<DemoSection label="Dot Variant">
				<StatusBadge status="success" variant="dot">
					Running
				</StatusBadge>
				<StatusBadge status="error" variant="dot">
					Failed
				</StatusBadge>
				<StatusBadge status="warning" variant="dot">
					Warning
				</StatusBadge>
				<StatusBadge status="info" variant="dot">
					Processing
				</StatusBadge>
				<StatusBadge status="ignored" variant="dot">
					Cancelled
				</StatusBadge>
			</DemoSection>
			<DemoSection label="Different Text Lengths">
				<StatusBadge status="success">OK</StatusBadge>
				<StatusBadge status="error">Authentication Failed</StatusBadge>
				<StatusBadge status="warning">Deprecated Feature</StatusBadge>
				<StatusBadge status="info">In Progress...</StatusBadge>
				<StatusBadge status="ignored">Not Applicable</StatusBadge>
			</DemoSection>
			<DemoSection label="With Custom Content">
				<StatusBadge status="success">✓ Completed</StatusBadge>
				<StatusBadge status="error">✗ Failed</StatusBadge>
				<StatusBadge status="warning">⚠ Warning</StatusBadge>
				<StatusBadge status="info">ℹ Processing</StatusBadge>
				<StatusBadge status="ignored">— Skipped</StatusBadge>
			</DemoSection>
		</UiPage>
	);
}
