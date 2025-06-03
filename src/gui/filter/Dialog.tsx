import * as React from 'react';
import { useState, useCallback } from 'react';
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import { Filters, PluginSettings, Tag } from '../../utils/types';
import MultiSelect, { Option } from '../MultiSelect';

interface Props {
	tags: Tag[];
	filters: Filters;
	onSave: (filters:Filters) => void;
	onCancel: () => void;
}

const tagsToOptions = (tags:Tag[]):Option[] => {
	return tags.map(t => {
		return {
			label: t.title,
			value: t.id,
		};
	});
}

const tagIdsToOptions = (tags:Tag[], tagIds:string[]):Option[] => {
	return tagIds.map(id => {
		const tag = tags.find(t => t.id === id);
		return {
			label: tag.title,
			value: tag.id,
		};
	});
}

const optionsToTagIds = (options:Option[]):string[] => {
	return options.map(t => t.value);
}

const FilterDialog: React.FC<Props> = (props:Props) => {
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>(props.filters?.tagIds || []);

	const onTagsChange = (value:Option[]) => {
		setSelectedTagIds(optionsToTagIds(value));
	}

	const onSave = useCallback(() => {
		const filters:Filters = {
			tagIds: selectedTagIds,
		}
		props.onSave(filters);
	}, [props.onSave, selectedTagIds]);

	return (
		<Dialog open={true} onClose={props.onCancel} fullWidth maxWidth="sm">
			<DialogTitle>Filter cards</DialogTitle>
			<DialogContent>
				<MultiSelect
					label='Select tags'
					options={tagsToOptions(props.tags)}
					onChange={onTagsChange}
					value={tagIdsToOptions(props.tags, selectedTagIds)}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={onSave} color="primary">Save</Button>
			</DialogActions>
		</Dialog>
	);
};

export default FilterDialog;
