import { render as testingLibraryRender } from '@testing-library/react';
import { createTheme, MantineProvider, mergeThemeOverrides, Modal } from '@mantine/core';
import { theme } from '../../theme';
import { fireEvent, userEvent, screen } from '@/test-utils';
import Tree from './page';

// Groundwork to test the visual pop ups properly
const testTheme = mergeThemeOverrides(
  theme,
  createTheme({
    components: {
      Modal: Modal.extend({
        defaultProps: {
          transitionProps: { duration: 0 },
        },
      }),
    },
  })
);

async function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  });
}

function switchExplanation() {
  const explanationToggle : HTMLElement = screen.getByLabelText('Explanation');
  fireEvent.click(explanationToggle);
}

function switchNulls() {
  const nullToggle : HTMLElement = screen.getByLabelText('Show Nulls');
  fireEvent.click(nullToggle);
}

function switchValues() {
  const valueToggle : HTMLElement = screen.getByLabelText('Show Values');
  fireEvent.click(valueToggle);
}

// > 0 => insert, < 0 => delete
async function doOperations(nums : number[], includeFinalExplanation : boolean) {
  async function insertOne(num : number) {
    const insertInput : HTMLElement = screen.getByTestId('insertInput');
    await userEvent.type(insertInput, String(num));
    const insertButton : HTMLElement = screen.getByText('Insert');
    fireEvent.click(insertButton);
  }

  async function deleteOne(num : number) {
    const deleteInput : HTMLElement = screen.getByTestId('deleteInput');
    await userEvent.type(deleteInput, String(num));
    const deleteButton : HTMLElement = screen.getByText('Delete');
    fireEvent.click(deleteButton);
  }

  switchExplanation();

  for(let i = 0; i < nums.length; i++) {
    if(i === nums.length - 1 && includeFinalExplanation) {
      switchExplanation();
    }

    if(nums[i] > 0) {
      await insertOne(nums[i]);
    }
    else {
      await deleteOne(-nums[i]);
    }
  }
}

describe('Sliders', () => {
  it('Nulls Can Be Hidden', () => {
    render(<Tree />);

    // Null is there
    expect(screen.getByText('Null')).toBeInTheDocument();

    // Turn nulls off
    switchNulls();

    // Null is not there
    expect(() => screen.getByText('Null')).toThrow();
  })

  it('Values Can Be Hidden', async () => {
    render(<Tree />);

    await doOperations([+500], true);

    // Value is there
    expect(screen.getByText(String(500))).toBeInTheDocument();

    // Turn values off
    switchValues();

    // Value is not there
    expect(() => screen.getByText(String(500))).toThrow();
  })

  it('Explanations Can Be Hidden', async () => {
    render(<Tree />);

    // Turn alerts off
    switchExplanation();

    await doOperations([+500], true);

    // There is no explanation for the insert
    expect(() => screen.getByText('Turn Root Black')).toThrow();
  })
})

describe('Insert Notifications', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperations([+500], true);

    // Should receive explanation stating that the root needs to be turned black
    expect(screen.getByText('Turn Root Black')).toBeInTheDocument();
  });

  it('Black Parent Notification', async () => {
    render(<Tree />);

    await doOperations([+500, +750], true);

    // Should receive explanation stating that the the add can go through w/o changes
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  });

  it('Red Outside Notification (On the right)', async () => {
    render(<Tree />);

    await doOperations([+500, +750, +875], true);

    // Should receive explanation saying to do a left rotation
    expect(screen.getByText('Red Alert - Left Rotate and Swap Colors')).toBeInTheDocument();
  })

  it('Red Outside Notification (On the left)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +125], true);

    // Should receive explanation saying to do a right rotation
    expect(screen.getByText('Red Alert - Right Rotate and Swap Colors'));
  })

  it('Red Inside Notification (Greater than root)', async () => {
    render(<Tree />);

    await doOperations([+500, +750, +625], true);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Right Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red Inside Notification (Less than root)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +375], true);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Left Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red with Two Red Parents Notification', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +625], true);

    // Should receive explanation saying to recolor the parents and grandparent and recheck
    expect(screen.getByText('Red Alert - Recolor and Move Up')).toBeInTheDocument();
  })
});

describe('Delete Notification', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperations([+500, -500], true);

    // Should receive explanation that deleting root does not cause problem and we can proceed
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  })

  it('Red Leaf Notification', async () => {
    render(<Tree />);

    await doOperations([+500, +750, -750], true);

    // Should receive explanation that we can safely remove red node without futher problems
    expect(screen.getByText('Simply Remove the Red Node')).toBeInTheDocument();
  })

  it('Black with One Red Child Notification', async () => {
    render(<Tree />);

    await doOperations([+500, +750, -500], true);

    // Should receive explanation that we must replace the black node with its red child
    expect(screen.getByText('Replace Parent with Red Child Turned Black')).toBeInTheDocument();
  })

  it('Node with Two Children Notification', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, -500], true);

    // Should receive explanation that we first need to find the in-order predecessor
    expect(screen.getByText('Replace Value with In-Order Predecessor to Get One Child')).toBeInTheDocument();
  })

  it('Node with a Red Sibling Notification (Right child)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +125, +375, +62, -750], true);

    // Should receive explanation to right rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Node with a Red Sibling Notification (Left child)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +625, +875, +562, -250], true);

    // Should receive explanation to left rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Outside (Right side)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +875, -250], true);

    // Should receive explantion to left rotate the sibling up
    expect(screen.getByText('Lack of Black - Left Rotate and Color New Children Black')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Outside (Left side)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +125, -750], true);

    // Should receive explantion to right rotate the sibling up
    expect(screen.getByText('Lack of Black - Right Rotate and Color New Children Black')).toBeInTheDocument();
  })
  
  it('Node with a Black Sibling with a Red Child on the Inside (Greater than root)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +625, -250], true);

    // Should receive notification that we need to right rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Inside (Less than root)', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +375, -750], true);

    // Should receive notification that we need to left rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Node with a Red Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +625, +875, +937, -937, -875], true);

    // Should receive notification that we need color sibling red and parent black
    expect(screen.getByText('Lack of Black - Swap Colors of Parent and Sibling')).toBeInTheDocument();
  })

  it('Node with a Black Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperations([+500, +250, +750, +875, -875, -750], true);

    // Should receive notification that we need color sibling red move the issue upwards
    expect(screen.getByText('Lack of Black - Color Sibling Red and Move Up')).toBeInTheDocument();
  })
})
