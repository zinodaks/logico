import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProcessTemplate, putProcessTemplate } from '../api/processTemplates';

export default function ProcessTemplates() {
  const [type, setType] = useState<'IM4' | 'TR8'>('IM4');
  const queryClient = useQueryClient();
  const { data: template } = useQuery({
    queryKey: ['process-template', type],
    queryFn: () => getProcessTemplate(type),
  });

  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    setSteps(template?.steps.map((s) => s.name) ?? []);
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (nextSteps: string[]) => putProcessTemplate(type, nextSteps.map((name) => ({ name }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['process-template', type] }),
  });

  function move(index: number, direction: -1 | 1) {
    const next = [...steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function addStep() {
    if (!newStep.trim()) return;
    setSteps([...steps, newStep.trim()]);
    setNewStep('');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Process Templates</h1>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['IM4', 'TR8'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`pb-2 px-1 ${type === t ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <ol className="space-y-2 mb-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-gray-400 w-6">{index + 1}.</span>
              <span className="flex-1">{step}</span>
              <button onClick={() => move(index, -1)} className="text-gray-500 hover:text-gray-900">
                ↑
              </button>
              <button onClick={() => move(index, 1)} className="text-gray-500 hover:text-gray-900">
                ↓
              </button>
              <button onClick={() => removeStep(index)} className="text-red-600 hover:text-red-800">
                Remove
              </button>
            </li>
          ))}
          {steps.length === 0 && <li className="text-gray-400">No steps defined yet.</li>}
        </ol>

        <div className="flex gap-2 mb-4">
          <input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder="New step name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button onClick={addStep} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            Add step
          </button>
        </div>

        <button
          onClick={() => saveMutation.mutate(steps)}
          disabled={saveMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {saveMutation.isSuccess && <span className="ml-3 text-green-600 text-sm">Saved.</span>}
      </div>
    </div>
  );
}
